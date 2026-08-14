require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001; // El puerto ahora también puede venir del .env
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ ERROR FATAL: La variable de entorno JWT_SECRET no está definida.");
  console.error("Crea un archivo .env en la carpeta 'backend' y añade JWT_SECRET='tu_secreto_aqui'");
  process.exit(1); // Detiene la aplicación si el secreto no está configurado
}
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;
if (!JWT_RESET_SECRET) {
  console.error("❌ ERROR FATAL: La variable de entorno JWT_RESET_SECRET no está definida.");
  console.error("Añade JWT_RESET_SECRET a tu archivo .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// --- Lógica de Almacenamiento de Usuarios (Temporalmente en JSON) ---
// En Vercel, solo podemos escribir en el directorio /tmp
const IS_VERCEL = process.env.VERCEL === '1';
const WRITABLE_DIR = IS_VERCEL ? '/tmp' : __dirname;
const USERS_PATH = path.join(WRITABLE_DIR, 'users.json');

function getUsers() {
  if (!fs.existsSync(USERS_PATH)) return [];
  try {
    const rawData = fs.readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (e) { return []; }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

// --- Creación de Superusuario al inicio ---
// Esta función se ejecuta una sola vez al arrancar el servidor.
// Si no existe ningún usuario, crea un administrador por defecto.
(async () => {
  const users = getUsers();
  if (users.length === 0) {
    console.log('🟡 No se encontraron usuarios. Creando cuenta de administrador por defecto...');
    try {
      const username = process.env.ADMIN_USERNAME || 'Dlauquen';
      const password = process.env.ADMIN_PASSWORD || 'Lauquen2026+';
      const email = process.env.ADMIN_EMAIL || 'admin@distrilauquen.com';

      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = {
        id: 1,
        username,
        apellido: 'Admin',
        telefono: '0000000000',
        cuit: '00-00000000-0',
        email,
        password: hashedPassword,
        role: 'admin',
        lista_precios: 'mecanicos',
        createdAt: new Date().toISOString()
      };
      saveUsers([adminUser]);
      console.log(`✅ Usuario administrador "${username}" creado con éxito.`);
    } catch (error) {
      console.error("❌ Error crítico al crear el usuario administrador:", error);
    }
  }
})();

// --- Configuración de Multer para subida de archivos ---
const createStorage = (fileName) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {      
      const destDir = IS_VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
      cb(null, destDir);
    },
    filename: function (req, file, cb) {
      cb(null, fileName);
    }
  });
};

const handleUpload = (req, res, listType) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  console.log(`📄 Archivo para lista '${listType}' recibido. Ejecutando script de parseo...`);

  const pythonScriptPath = path.join(__dirname, 'scripts', 'parse_excel.py');
  exec(`python "${pythonScriptPath}" ${listType}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando el script: ${error.message}`);
      return res.status(500).json({ message: 'Error al procesar el archivo Excel.', details: stderr });
    }
    if (stderr) {
        console.warn(`Script stderr: ${stderr}`);
    }
    console.log(`Script stdout: ${stdout}`);
    
    cargarRepuestos(); // Recargar los catálogos en memoria

    res.json({ message: `Archivo para lista '${listType}' subido y procesado con éxito.`, output: stdout });
  });
};

const uploadMecanicos = multer({ storage: createStorage('distribuidor.xlsx') });
const uploadFinales = multer({ storage: createStorage('final.xlsx') });


// --- Lógica del Catálogo ---
const MECANICOS_JSON_PATH = path.join(WRITABLE_DIR, 'repuestos_mecanicos.json');
const FINALES_JSON_PATH = path.join(WRITABLE_DIR, 'repuestos_finales.json');
let repuestos = {
  mecanicos: [],
  finales: []
};

function cargarRepuestos() {
  try {
    if (fs.existsSync(MECANICOS_JSON_PATH)) {
      const rawDataMecanicos = fs.readFileSync(MECANICOS_JSON_PATH, 'utf-8');
      repuestos.mecanicos = JSON.parse(rawDataMecanicos);
    } else {
      repuestos.mecanicos = [];
    }
    if (fs.existsSync(FINALES_JSON_PATH)) {
      const rawDataFinales = fs.readFileSync(FINALES_JSON_PATH, 'utf-8');
      repuestos.finales = JSON.parse(rawDataFinales);
    } else {
      repuestos.finales = [];
    }
    console.log(`✅ Catálogo recargado: ${repuestos.mecanicos.length} repuestos (Mecánicos), ${repuestos.finales.length} repuestos (Finales).`);
  } catch (error) {
    console.error('❌ Error al cargar JSONs de repuestos:', error.message);
    repuestos = { mecanicos: [], finales: [] }; // Si hay error, vaciamos para no servir datos viejos
  }
}

// Carga inicial
cargarRepuestos();

// --- Configuración de Nodemailer (para envío de emails) ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify().then(() => {
    console.log("📬 Servidor de email listo para enviar correos.");
}).catch(console.error);

// Ya no se usa la recarga automática por observación de archivo
// fs.watchFile(jsonPath, ...);

// --- Middlewares de Autenticación ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proveyó un token.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // Añadimos el payload del user al request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
};

// Ruta raíz para confirmar que el servidor está vivo
app.get('/', (req, res) => {
  res.send('<h1>API del Catálogo de Repuestos</h1><p>Servidor funcionando. Prueba el endpoint <a href="/api/health">/api/health</a>.</p>');
});

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    items_cargados: {
      mecanicos: repuestos.mecanicos.length,
      finales: repuestos.finales.length
    } 
  });
});

// Endpoint de búsqueda omnibox (ahora protegido)
app.get('/api/buscar', authMiddleware, (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const limite = parseInt(req.query.limite) || 50;
  const { lista_precios: listaPreciosUsuario = 'finales' } = req.user;

  if (!query) {
    return res.json({ total: 0, resultados: [] });
  }

  const palabras = query.split(' ').filter(p => p.length > 0);
  const catalogoActivo = repuestos[listaPreciosUsuario] || [];

  const filtrados = catalogoActivo.filter(item => {
    const textoFila = item.datos_raw.join(' ').toLowerCase();
    const categoria = item.hoja_origen.toLowerCase();
    const todoElTexto = `${categoria} ${textoFila}`;

    return palabras.every(palabra => todoElTexto.includes(palabra));
  });

  res.json({
    total: filtrados.length,
    resultados: filtrados.slice(0, limite)
  });
});

// --- Endpoints de Autenticación ---

// Registro de nuevos usuarios
app.post('/api/auth/register', async (req, res) => {
  const { username, apellido, telefono, cuit, email, password } = req.body;

  if (!username || !apellido || !telefono || !cuit || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
  }
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
  }
  if (users.find(u => u.cuit === cuit)) {
    return res.status(409).json({ message: 'El CUIT ya está registrado.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Encriptamos la contraseña

  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username,
    apellido,
    telefono,
    cuit,
    email,
    password: hashedPassword,
    role: 'cliente', // Todos los usuarios nuevos son clientes
    lista_precios: 'finales', // Por defecto, ven precios de cliente final
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  console.log(`✅ Nuevo usuario registrado: ${username}`);
  res.status(201).json({ message: 'Usuario registrado con éxito.' });
});

// Inicio de sesión de usuarios
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
  }

  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  // Usamos bcrypt.compare para verificar la contraseña de forma segura
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas.' }); // Mensaje genérico por seguridad
  }

  // Creamos el token JWT
  const payload = { 
    user: { 
      id: user.id, 
      username: user.username,
      role: user.role,
      lista_precios: user.lista_precios
    } 
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // El token expira en 1 día

  res.json({ token });
});

// Endpoint para obtener los datos del usuario logueado
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Endpoint para solicitar reseteo de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es requerido.' });
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Por seguridad, siempre respondemos igual, exista o no el email.
  if (user) {
    try {
      const resetToken = jwt.sign({ id: user.id }, JWT_RESET_SECRET, { expiresIn: '15m' });
      const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

      const mailOptions = {
        from: `"DistriLauquen" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: 'Restablecimiento de contraseña',
        html: `
          <p>Hola ${user.username},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
          <p>Este enlace expirará en 15 minutos.</p>
          <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Enlace de reseteo enviado a ${user.email}.`);
      // La siguiente línea es clave para ver el email en Ethereal
      console.log(`✉️  URL de previsualización del email: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error("❌ Error al enviar el email de reseteo:", error);
      // No informamos del error al cliente por seguridad
    }
  }

  res.json({ message: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.' });
});

// Endpoint para restablecer la contraseña
app.post('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_RESET_SECRET);
    const userId = decoded.id;
    const hashedPassword = await bcrypt.hash(password, 10);
    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(400).json({ message: 'Token inválido o usuario no encontrado.' });
    users[userIndex].password = hashedPassword;
    saveUsers(users);
    console.log(`✅ Contraseña restablecida para el usuario ID ${userId}.`);
    res.json({ message: 'Tu contraseña ha sido restablecida con éxito.' });
  } catch (error) {
    return res.status(401).json({ message: 'El enlace de restablecimiento es inválido o ha expirado.' });
  }
});

// Endpoint para cambiar la contraseña de un usuario logueado
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const user = users[userIndex];

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  users[userIndex].password = hashedNewPassword;
  saveUsers(users);

  console.log(`✅ Contraseña cambiada para el usuario ID ${userId}.`);
  res.json({ message: 'Contraseña actualizada con éxito.' });
});

// Endpoint para que un usuario actualice su propio perfil
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { apellido, telefono, cuit, email } = req.body;
  const userId = req.user.id;

  if (!apellido || !telefono || !cuit || !email) {
    return res.status(400).json({ message: 'Apellido, teléfono, CUIT y email son requeridos.' });
  }

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  // Validar que el CUIT no esté en uso por OTRO usuario
  const existingCuitUser = users.find(u => u.cuit === cuit && u.id !== userId);
  if (existingCuitUser) {
    return res.status(409).json({ message: 'El CUIT ya está registrado por otro usuario.' });
  }

  // Validar que el email no esté en uso por OTRO usuario
  const existingEmailUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId);
  if (existingEmailUser) {
    return res.status(409).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
  }

  // Actualizar datos
  users[userIndex] = {
    ...users[userIndex],
    apellido,
    telefono,
    cuit,
    email
  };

  saveUsers(users);

  // Generar un nuevo token con la información actualizada
  const updatedUser = users[userIndex];
  const payload = { 
    user: { 
      id: updatedUser.id, 
      username: updatedUser.username,
      role: updatedUser.role,
      lista_precios: updatedUser.lista_precios
    } 
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

  console.log(`✅ Perfil actualizado para el usuario ID ${userId}.`);
  res.json({ message: 'Perfil actualizado con éxito.', token });
});

// --- Endpoints de Administración ---

// Subir lista de precios para Mecánicos (archivo distribuidor.xlsx)
app.post('/api/admin/upload-lista/mecanicos', [authMiddleware, adminMiddleware, uploadMecanicos.single('listaPrecios')], (req, res) => {
  handleUpload(req, res, 'mecanicos');
});

// Subir lista de precios para Finales (archivo final.xlsx)
app.post('/api/admin/upload-lista/finales', [authMiddleware, adminMiddleware, uploadFinales.single('listaPrecios')], (req, res) => {
  handleUpload(req, res, 'finales');
});

// Obtener todos los clientes
app.get('/api/admin/clientes', [authMiddleware, adminMiddleware], (req, res) => {
  const users = getUsers();
  const clientes = users.map(({ password, ...user }) => user); // No enviar las contraseñas
  res.json(clientes);
});

// Actualizar un cliente
app.put('/api/admin/clientes/:id', [authMiddleware, adminMiddleware], (req, res) => {
  const userId = parseInt(req.params.id);
  const { lista_precios } = req.body;

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  if (lista_precios) {
    if (!['mecanicos', 'finales'].includes(lista_precios)) {
      return res.status(400).json({ message: 'El campo "lista_precios" es inválido o está ausente.' });
    }
    users[userIndex].lista_precios = lista_precios;
  }

  saveUsers(users);

  console.log(`🔧 Datos del usuario ID ${userId} actualizados.`);
  res.json({ message: 'Usuario actualizado con éxito.', user: users[userIndex] });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

// Manejo de cierre de fs.watchFile al terminar el proceso
process.on('SIGINT', () => {
  // fs.unwatchFile(jsonPath); // Ya no se usa
  process.exit();
});