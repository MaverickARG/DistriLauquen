require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { execFile } = require('child_process');
const multer = require('multer');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001; // El puerto ahora también puede venir del .env

// --- Verificación de Variables de Entorno Críticas ---
const fatalEnvVars = ['JWT_SECRET', 'JWT_RESET_SECRET'];
const warningEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_URL'];

const missingFatalVars = fatalEnvVars.filter(varName => !process.env[varName]);
const missingWarningVars = warningEnvVars.filter(varName => !process.env[varName]);

if (missingFatalVars.length > 0) {
  console.error("❌ ERROR FATAL: Faltan las siguientes variables de entorno críticas:");
  missingFatalVars.forEach(varName => console.error(`  - ${varName}`));
  console.error("\nAsegúrate de haberlas añadido en la pestaña 'Environment' de tu servicio en Render.");
  process.exit(1);
}

if (missingWarningVars.length > 0) {
  console.warn("🟡 ADVERTENCIA: Faltan variables de entorno para el envío de emails. La función de reseteo de contraseña no funcionará.");
  missingWarningVars.forEach(varName => console.warn(`  - ${varName}`));
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;

// Validar que JWT_SECRET sea suficientemente largo
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("❌ ERROR: JWT_SECRET debe tener al menos 32 caracteres.");
  process.exit(1);
}

// --- Configuración de CORS restringido ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// --- Configuración de Rate Limiting ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros máximo por hora
  message: { message: 'Demasiados registros. Intenta de nuevo en una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos máximo por hora
  message: { message: 'Demasiados intentos de restablecimiento de contraseña. Intenta de nuevo en una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Aplicar middlewares de seguridad ---
app.use(helmet()); // Agregar headers de seguridad
app.use(cors(corsOptions)); // CORS restringido
app.use(express.json());

// --- Lógica de Almacenamiento de Usuarios (SQLite persistente) ---
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'users.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    nombre TEXT,
    apellido TEXT,
    telefono TEXT,
    cuit TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    lista_precios TEXT,
    activo INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

function getLegacyUsers() {
  const legacyPath = path.join(__dirname, 'users.json');
  if (!fs.existsSync(legacyPath)) return [];

  try {
    const raw = fs.readFileSync(legacyPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('⚠️ No se pudo leer users.json legacy:', error.message);
    return [];
  }
}

function migrateLegacyUsers() {
  const legacyUsers = getLegacyUsers();
  if (!legacyUsers.length) return;

  const existingCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (existingCount > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (id, username, nombre, apellido, telefono, cuit, email, password, role, lista_precios, activo, createdAt)
    VALUES (@id, @username, @nombre, @apellido, @telefono, @cuit, @email, @password, @role, @lista_precios, @activo, @createdAt)
  `);

  const tx = db.transaction((users) => {
    for (const user of users) {
      insert.run({
        id: user.id,
        username: user.username,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        cuit: user.cuit || '',
        email: user.email || '',
        password: user.password,
        role: user.role || 'cliente',
        lista_precios: user.lista_precios || 'distribuidores',
        activo: user.activo ? 1 : 0,
        createdAt: user.createdAt || new Date().toISOString()
      });
    }
  });

  tx(legacyUsers);
  console.log(`✅ Se migraron ${legacyUsers.length} usuarios desde users.json a SQLite.`);
}

function getUsers() {
  const rows = db.prepare('SELECT * FROM users ORDER BY id ASC').all();
  return rows.map(row => ({
    ...row,
    activo: Boolean(row.activo)
  }));
}

function saveUsers(users) {
  const insert = db.prepare(`
    INSERT INTO users (id, username, nombre, apellido, telefono, cuit, email, password, role, lista_precios, activo, createdAt)
    VALUES (@id, @username, @nombre, @apellido, @telefono, @cuit, @email, @password, @role, @lista_precios, @activo, @createdAt)
  `);

  const tx = db.transaction((items) => {
    db.exec('DELETE FROM users');
    for (const user of items) {
      insert.run({
        id: user.id,
        username: user.username,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        cuit: user.cuit || '',
        email: user.email || '',
        password: user.password,
        role: user.role || 'cliente',
        lista_precios: user.lista_precios || 'distribuidores',
        activo: user.activo ? 1 : 0,
        createdAt: user.createdAt || new Date().toISOString()
      });
    }
  });

  tx(users);
}

migrateLegacyUsers();

// --- Creación de Superusuario al inicio ---
// Esta función se ejecuta una sola vez al arrancar el servidor.
// Si no existe ningún usuario, crea un administrador por defecto.
(async () => {
  const users = getUsers();
  if (users.length === 0) {
    console.log('🟡 No se encontraron usuarios. Creando cuenta de administrador por defecto...');
    try {
      // Generar contraseña fuerte aleatoria si no está configurada
      const generateStrongPassword = () => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '@$!%*?&#';
        const all = uppercase + lowercase + numbers + symbols;
        
        let password = '';
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        password += symbols.charAt(Math.floor(Math.random() * symbols.length));
        
        for (let i = 0; i < 12; i++) {
          password += all.charAt(Math.floor(Math.random() * all.length));
        }
        
        return password.split('').sort(() => Math.random() - 0.5).join('');
      };

      const username = process.env.ADMIN_USERNAME || 'Dlauquen';
      let password = process.env.ADMIN_PASSWORD;
      
      // Si no hay contraseña configurada, generar una fuerte
      if (!password) {
        password = generateStrongPassword();
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('⚠️  CREDENCIALES DE ADMINISTRADOR GENERADAS AUTOMÁTICAMENTE');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`Usuario: ${username}`);
        console.log(`Contraseña: ${password}`);
        console.log('⚠️  COPIA ESTAS CREDENCIALES EN UN LUGAR SEGURO');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
      }

      const email = process.env.ADMIN_EMAIL || 'admin@distrilauquen.com';

      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = {
        id: 1,
        username,
        nombre: 'Admin',
        apellido: 'Admin',
        telefono: '0000000000',
        cuit: '00-00000000-0',
        email,
        password: hashedPassword,
        role: 'admin',
        lista_precios: 'distribuidores',
        activo: true, // El admin se crea activo por defecto
        createdAt: new Date().toISOString()
      };
      saveUsers([adminUser]);
      console.log(`✅ Usuario administrador "${username}" creado con éxito. Lista de precios: ${adminUser.lista_precios}`);
    } catch (error) {
      console.error("❌ Error crítico al crear el usuario administrador:", error);
    }
  }
})();

// --- Configuración de Multer para subida de archivos ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dataDir = path.join(__dirname, 'data'); // Asegúrate de que la carpeta 'data' esté en el backend
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      cb(null, dataDir);
    },
    filename: function (req, file, cb) {
      // Siempre guardar como 'lista.xlsx', sobrescribiendo el anterior.
      cb(null, 'lista.xlsx');
    }
  });

const uploadPriceList = multer({ storage: storage });

const handleUpload = (req, res) => { // Ya no necesitamos listType aquí, se asume 'distribuidores'
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  console.log(`📄 Archivo de lista de precios recibido. Ejecutando script de parseo...`);

  const pythonScriptPath = path.join(__dirname, 'scripts', 'parse_excel.py');
  // Usar execFile en lugar de exec para mayor seguridad
  execFile('python', [pythonScriptPath], { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando el script: ${error.message}`);
      return res.status(500).json({ message: 'Error al procesar el archivo Excel.', details: stderr });
    }
    if (stderr) {
        console.warn(`Script stderr: ${stderr}`);
    }
    console.log(`Script stdout: ${stdout}`);
    
    cargarRepuestos(); // Recargar los catálogos en memoria

    res.json({ message: `Archivo de lista de precios subido y procesado con éxito.`, output: stdout });
  });
};

// --- Lógica del Catálogo ---
const DISTRIBUIDORES_JSON_PATH = path.join(__dirname, 'repuestos_distribuidores.json');
let repuestos = {
  distribuidores: []
};

function cargarRepuestos() {
  try {
    if (fs.existsSync(DISTRIBUIDORES_JSON_PATH)) {
      const rawDataDistribuidores = fs.readFileSync(DISTRIBUIDORES_JSON_PATH, 'utf-8');
      repuestos.distribuidores = JSON.parse(rawDataDistribuidores);
    } else {
      repuestos.distribuidores = [];
    }
    console.log(`✅ Catálogo recargado: ${repuestos.distribuidores.length} repuestos (Distribuidores).`);
  } catch (error) {
    console.error('❌ Error al cargar JSONs de repuestos:', error.message);
    repuestos = { distribuidores: [] }; // Si hay error, vaciamos para no servir datos viejos
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
    const users = getUsers();
    const currentUser = users.find(u => u.id === decoded.user.id);

    if (!currentUser) {
      return res.status(401).json({ message: 'Usuario no encontrado.' });
    }

    if (currentUser.role === 'cliente' && !currentUser.activo) {
      return res.status(403).json({ message: 'Tu cuenta está desactivada por un administrador.' });
    }

    req.user = { ...decoded.user, activo: currentUser.activo };
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
      distribuidores: repuestos.distribuidores.length
    } 
  });
});

// Endpoint de búsqueda omnibox (ahora protegido)
app.get('/api/buscar', authMiddleware, (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const limite = parseInt(req.query.limite) || 50;
  const pagina = parseInt(req.query.pagina) || 1; // 1-based
  const { lista_precios: listaPreciosUsuario = 'distribuidores' } = req.user; // Default a distribuidores

  if (!query) {
    return res.json({ total: 0, resultados: [] });
  }

  const palabras = query.split(' ').filter(p => p.length > 0);
  const catalogoActivo = repuestos[listaPreciosUsuario] || [];

  const filtrados = catalogoActivo.filter(item => {
    // Se construye una cadena de texto con todos los datos relevantes del producto para la búsqueda.
    const textoBuscable = [
      item.codigo,
      item.descripcion,
      item.marca,
      item.hoja_origen // También busca en el nombre de la categoría/hoja
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => textoBuscable.includes(palabra));
  });

  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / limite));
  const start = (Math.max(1, pagina) - 1) * limite;
  const resultados = filtrados.slice(start, start + limite);

  res.json({
    total,
    pagina: Math.max(1, pagina),
    per_page: limite,
    total_pages: totalPages,
    resultados
  });
});

// --- Endpoints de Autenticación ---

// Registro de nuevos usuarios
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  const { username, nombre, apellido, telefono, cuit, email, password, confirmPassword } = req.body;

  if (!username || !apellido || !telefono || !cuit || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  // Validar email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'El correo electrónico no es válido.' });
  }

  // Validar contraseña fuerte
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&).' });
  }

  // Validar CUIT (formato básico: XX-XXXXXXXX-X)
  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuitRegex.test(cuit)) {
    return res.status(400).json({ message: 'El CUIT debe tener el formato XX-XXXXXXXX-X.' });
  }

  // Sanitizar entrada
  const sanitizedUsername = validator.trim(validator.escape(username));
  const sanitizedNombre = validator.trim(validator.escape(nombre || ''));
  const sanitizedApellido = validator.trim(validator.escape(apellido || ''));
  const sanitizedTelefono = validator.trim(validator.escape(telefono || ''));

  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === sanitizedUsername.toLowerCase())) {
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
    username: sanitizedUsername,
    nombre: sanitizedNombre,
    apellido: sanitizedApellido,
    telefono: sanitizedTelefono,
    cuit,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'cliente', // Todos los usuarios nuevos son clientes
    lista_precios: 'distribuidores', // Por defecto, ven precios de distribuidor
    activo: false, // Los nuevos usuarios deben ser activados por un admin
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  console.log(`✅ Nuevo usuario registrado: ${username}`);
  res.status(201).json({ message: 'Usuario registrado con éxito.' });
});

// Inicio de sesión de usuarios
app.post('/api/auth/login', loginLimiter, async (req, res) => {
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

  // Verificamos si el usuario cliente está activo
  if (user.role === 'cliente' && !user.activo) {
    return res.status(403).json({ message: 'Tu cuenta está pendiente de activación por un administrador.' });
  }

  // Creamos el token JWT
  const payload = { 
    user: { 
      id: user.id, 
      username: user.username,
      role: user.role,
      lista_precios: user.lista_precios,
      nombre: user.nombre || '',
      apellido: user.apellido || ''
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
app.post('/api/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'El correo electrónico es requerido.' });
  }

  // Validar formato de email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'El correo electrónico no es válido.' });
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Por seguridad, siempre respondemos igual, exista o no el email.
  if (user) {
    try {
      const resetToken = jwt.sign({ id: user.id }, JWT_RESET_SECRET, { expiresIn: '15m' });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      const mailOptions = {
        from: `"DistriLauquen" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: 'Restablecimiento de contraseña',
        html: `
          <p>Hola ${validator.escape(user.username)},</p>
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

  // Validar contraseña fuerte
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&).' });
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

  // Validar contraseña fuerte
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&).' });
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
  const { nombre, apellido, telefono, cuit, email } = req.body;
  const userId = req.user.id;

  if (!nombre || !apellido || !telefono || !cuit || !email) {
    return res.status(400).json({ message: 'Nombre, apellido, teléfono, CUIT y email son requeridos.' });
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
    nombre,
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
      lista_precios: updatedUser.lista_precios,
      nombre: updatedUser.nombre || '',
      apellido: updatedUser.apellido || ''
    } 
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

  console.log(`✅ Perfil actualizado para el usuario ID ${userId}.`);
  res.json({ message: 'Perfil actualizado con éxito.', token });
});

// --- Endpoints de Administración ---
// Subir lista de precios para Distribuidores (archivo distribuidor.xlsx)
app.post('/api/admin/upload-lista', [authMiddleware, adminMiddleware, uploadPriceList.single('listaPrecios')], (req, res) => {
  handleUpload(req, res);
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
    if (!['distribuidores'].includes(lista_precios)) { // Solo permitir 'distribuidores'
      return res.status(400).json({ message: 'El campo "lista_precios" es inválido o está ausente.' });
    }
    users[userIndex].lista_precios = lista_precios;
  }

  saveUsers(users);

  console.log(`🔧 Datos del usuario ID ${userId} actualizados.`);
  res.json({ message: 'Usuario actualizado con éxito.', user: users[userIndex] });
});

// Endpoint para obtener el número de usuarios pendientes de activación
app.get('/api/admin/pending-count', [authMiddleware, adminMiddleware], (req, res) => {
  const users = getUsers();
  const pendingCount = users.filter(u => u.role === 'cliente' && !u.activo).length;
  res.json({ pendingCount });
});

// Endpoint para que el admin active/desactive un cliente
app.put('/api/admin/clientes/:id/toggle-active', [authMiddleware, adminMiddleware], (req, res) => {
  const userId = parseInt(req.params.id);
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ message: 'El estado "activo" es requerido y debe ser un booleano.' });
  }

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'Usuario no encontrado.' });

  users[userIndex].activo = activo;
  saveUsers(users);
  console.log(`🔧 Estado de activación del usuario ID ${userId} cambiado a ${activo}.`);
  res.json({ message: 'Estado de activación actualizado con éxito.', user: users[userIndex] });
});

// Endpoint para que el admin actualice el perfil de un cliente (apellido, telefono, cuit, email)
app.put('/api/admin/clientes/:id/profile', [authMiddleware, adminMiddleware], (req, res) => {
  const userId = parseInt(req.params.id);
  const { nombre, apellido, telefono, cuit, email } = req.body;

  if (!nombre || !apellido || !telefono || !cuit || !email) {
    return res.status(400).json({ message: 'Nombre, apellido, teléfono, CUIT y email son requeridos.' });
  }

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'Usuario no encontrado.' });

  // Validar que el CUIT y email no estén en uso por OTRO usuario
  const existingCuitUser = users.find(u => u.cuit === cuit && u.id !== userId);
  if (existingCuitUser) return res.status(409).json({ message: 'El CUIT ya está registrado por otro usuario.' });
  const existingEmailUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId);
  if (existingEmailUser) return res.status(409).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });

  users[userIndex] = {
    ...users[userIndex],
    nombre,
    apellido,
    telefono,
    cuit,
    email
  };

  saveUsers(users);
  console.log(`🔧 Perfil del usuario ID ${userId} actualizado por admin.`);
  const { password, ...userWithoutPassword } = users[userIndex];
  res.json({ message: 'Perfil actualizado con éxito.', user: userWithoutPassword });
});

// Endpoint para que el admin cambie la contraseña de un cliente
app.post('/api/admin/clientes/:id/password', [authMiddleware, adminMiddleware], async (req, res) => {
  const userId = parseInt(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'Usuario no encontrado.' });

  const hashed = await bcrypt.hash(newPassword, 10);
  users[userIndex].password = hashed;
  saveUsers(users);
  console.log(`🔐 Contraseña actualizada por admin para usuario ID ${userId}.`);
  res.json({ message: 'Contraseña actualizada con éxito.' });
});

// Endpoint para eliminar un cliente
app.delete('/api/admin/clientes/:id', [authMiddleware, adminMiddleware], (req, res) => {
  const userId = parseInt(req.params.id);
  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'Usuario no encontrado.' });

  const removed = users.splice(userIndex, 1)[0];
  saveUsers(users);
  console.log(`🗑️ Usuario ID ${userId} eliminado por admin (${removed.username}).`);
  res.json({ message: 'Usuario eliminado con éxito.' });
});

// Servir los archivos ya compilados del frontend (Vite)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Cualquier ruta que no sea /api/... devuelve el index.html del frontend
// (para que las rutas de React Router funcionen al recargar la página)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

// Manejo de cierre de fs.watchFile al terminar el proceso
process.on('SIGINT', () => {
  // fs.unwatchFile(jsonPath); // Ya no se usa
  process.exit();
});