# 🔍 AUDITORÍA COMPLETA - DistriLauquen

**Fecha de Auditoría:** 2026-08-18  
**Versión del Proyecto:** 1.2.0  
**Estado General:** ⚠️ CRÍTICO - Hay problemas de seguridad que requieren atención inmediata

---

## 📋 ÍNDICE
1. [Hallazgos Críticos](#hallazgos-críticos)
2. [Hallazgos de Alto Riesgo](#hallazgos-de-alto-riesgo)
3. [Hallazgos Medios](#hallazgos-medios)
4. [Hallazgos Bajos](#hallazgos-bajos)
5. [Análisis por Componente](#análisis-por-componente)
6. [Recomendaciones Prioritarias](#recomendaciones-prioritarias)
7. [Checklist de Acciones](#checklist-de-acciones)

---

## 🚨 HALLAZGOS CRÍTICOS

### 1. **Ejecución Arbitraria de Código Python (RCE)**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `backend/index.js` - Línea ~225  
**Problema:**
```javascript
exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
```
**Riesgo:** El comando usa `exec()` sin validación. Si un nombre de archivo puede manipularse, es una vulnerabilidad de Remote Code Execution (RCE).

**Impacto:** Ejecutar código malicioso en el servidor.

**Solución:**
- Usar `execFile()` en lugar de `exec()` con argumentos como array
- Validar extensiones de archivo
- Usar child_process.spawn() para casos complejos

```javascript
const { execFile } = require('child_process');
execFile('python', [pythonScriptPath], (error, stdout, stderr) => {
```

---

### 2. **Credenciales Admin Hardcodeadas por Defecto**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `backend/index.js` - Línea ~155-180  
**Problema:**
```javascript
const username = process.env.ADMIN_USERNAME || 'Dlauquen';
const password = process.env.ADMIN_PASSWORD || 'Lauquen2026+';
const email = process.env.ADMIN_EMAIL || 'admin@distrilauquen.com';
```

**Riesgo:** 
- Las credenciales por defecto son predecibles y públicas (código visible en el repositorio)
- Si las variables de entorno no están configuradas, usa contraseña débil
- La contraseña está en el historio de Git

**Impacto:** Acceso administrativo no autorizado al sistema.

**Solución:**
- Generar credenciales fuertes aleatorias al primer inicio
- Forzar cambio de contraseña en el primer login
- Nunca almacenar contraseñas en código o comentarios

```javascript
if (!process.env.ADMIN_PASSWORD) {
  console.error("❌ ADMIN_PASSWORD no configurada. Abortando.");
  process.exit(1);
}
```

---

### 3. **SQLi Potencial en Búsqueda**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `backend/index.js` - Línea ~330-350  
**Problema:**
```javascript
const query = (req.query.q || '').trim().toLowerCase();
// Búsqueda en JSON, pero manipulación de parámetros sin validación
```

**Riesgo:** Aunque actualmente busca en JSON (no SQL), los parámetros `limite` y `pagina` no se validan:
```javascript
const limite = parseInt(req.query.limite) || 50;
const pagina = parseInt(req.query.pagina) || 1;
```

Si se migra a SQL en el futuro, esto será vulnerable. Además, `parseInt()` no previene valores negativos o gigantes.

**Solución:**
```javascript
const limite = Math.max(1, Math.min(parseInt(req.query.limite) || 50, 1000));
const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
```

---

### 4. **Base de Datos SQLite sin Respaldo**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `backend/index.js` - Línea ~49-52  
**Problema:**
```javascript
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
// No hay respaldos automáticos
```

**Riesgo:** 
- Pérdida de datos de usuarios si falla el servidor
- No hay sistema de respaldo o replicación
- Los archivos `.sqlite` están en `.gitignore` (correcto) pero sin respaldo central

**Impacto:** Pérdida completa de datos de usuarios y transacciones.

**Solución:**
- Implementar respaldos diarios automáticos
- Usar Render's Managed Database o PostgreSQL
- Replicar base de datos a buckets de GCS/S3 diariamente

---

### 5. **Falta de Rate Limiting y Throttling**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** Todos los endpoints  
**Problema:** No hay rate limiting en endpoints críticos (login, registro, reset de contraseña)

**Riesgo:** 
- Ataques de fuerza bruta en login
- Spam de registro masivo
- DoS por solicitudes excesivas

**Impacto:** Servicio inutilizable; cuentas comprometidas.

**Solución:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5 // 5 intentos por IP
});

app.post('/api/auth/login', limiter, async (req, res) => {
```

---

### 6. **CORS Demasiado Permisivo**
**Severidad:** 🔴 CRÍTICA  
**Ubicación:** `backend/index.js` - Línea ~38  
**Problema:**
```javascript
app.use(cors());
```

**Riesgo:** 
- Permite solicitudes CORS desde CUALQUIER dominio
- Ataques CSRF desde sitios maliciosos

**Impacto:** Robo de tokens; acceso no autorizado.

**Solución:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## ⚠️ HALLAZGOS DE ALTO RIESGO

### 7. **Tokens JWT sin Refresh Token**
**Severidad:** 🟠 ALTO  
**Ubicación:** `backend/index.js` - Línea ~420-430  
**Problema:**
```javascript
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
```

**Riesgo:** 
- Tokens válidos por 24 horas completos
- Si se expone un token, es válido durante todo un día
- No hay forma de revocar tokens prematuramente (logout)

**Impacto:** Mayor riesgo si token es capturado.

**Solución:** Implementar refresh tokens:
```javascript
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
```

---

### 8. **Contraseñas Débiles Permitidas**
**Severidad:** 🟠 ALTO  
**Ubicación:** `backend/index.js` - Línea ~407, 560  
**Problema:**
```javascript
// Solo valida longitud mínima de 6 caracteres
if (newPassword.length < 6) {
  return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
}
```

**Riesgo:** "123456" es válido.

**Solución:**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({ 
    message: 'La contraseña debe tener 8+ caracteres, incluir mayúsculas, minúsculas, números y símbolos.' 
  });
}
```

---

### 9. **Tokens en URL (Reset Password)**
**Severidad:** 🟠 ALTO  
**Ubicación:** `backend/index.js` - Línea ~475  
**Problema:**
```javascript
const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
```

**Riesgo:** 
- Tokens en URLs se guardan en historial del navegador
- Se exponen en logs de servidores web
- Pueden ser compartidos en emails planos

**Impacto:** Tokens de reset comprometidos.

**Solución:** Usar POST con token en body, no en URL.

---

### 10. **Sin Validación de Entrada (XSS)**
**Severidad:** 🟠 ALTO  
**Ubicación:** Múltiples endpoints  
**Problema:** No hay sanitización de entrada en campos de texto:
```javascript
const { username, nombre, apellido, ... } = req.body;
// Se guarda directamente sin sanitizar
```

**Riesgo:** Inyección de HTML/JavaScript (Stored XSS).

**Solución:**
```javascript
const validator = require('validator');
const nombre = validator.trim(validator.escape(req.body.nombre || ''));
```

---

### 11. **Información Sensible en Respuestas de Error**
**Severidad:** 🟠 ALTO  
**Ubicación:** `backend/index.js` - Línea ~360  
**Problema:**
```javascript
console.log(`Script stdout: ${stdout}`); // Podría contener datos sensibles
res.json({ message: `Archivo de lista de precios subido...`, output: stdout });
```

**Riesgo:** Stack traces y detalles técnicos se exponen al cliente.

**Solución:**
```javascript
if (error) {
  console.error(`Error ejecutando el script: ${error.message}`);
  return res.status(500).json({ message: 'Error al procesar el archivo Excel.' });
}
```

---

### 12. **Contraseña de Admin en Logs**
**Severidad:** 🟠 ALTO  
**Ubicación:** `backend/index.js` - Línea ~160  
**Problema:**
```javascript
console.log(`✅ Usuario administrador "${username}" creado con éxito...`);
```

**Riesgo:** La contraseña podría aparecer en logs o terminal si hay errores.

**Solución:** Nunca loguear credenciales.

---

### 13. **Datos de Usuario en Token JWT**
**Severidad:** 🟠 ALTO  
**Ubicación:** `frontend/src/AuthContext.jsx` - Línea ~18  
**Problema:**
```javascript
const decoded = jwtDecode(token);
```

JWT es codificado, no encriptado. El payload es Base64 decodificable.

**Riesgo:** Datos de usuario (nombre, apellido, etc.) son legibles en el token.

**Solución:** Colocar solo `userId` y `role` en JWT; recuperar datos de `/api/auth/me`.

---

## 📊 HALLAZGOS MEDIOS

### 14. **Sin Validación de Email**
**Severidad:** 🟡 MEDIO  
**Ubicación:** `backend/index.js` - Línea ~390  
**Problema:** No valida formato de email correctamente.

**Solución:**
```javascript
const validator = require('validator');
if (!validator.isEmail(email)) {
  return res.status(400).json({ message: 'Email inválido.' });
}
```

---

### 15. **Sin Validación de CUIT**
**Severidad:** 🟡 MEDIO  
**Ubicación:** `backend/index.js` - Línea ~390  
**Problema:** Acepta cualquier string como CUIT.

**Solución:** Validar formato de CUIT (Argentina: XX-XXXXXXXX-X).

---

### 16. **Búsqueda sin Paginación en Frontend**
**Severidad:** 🟡 MEDIO  
**Ubicación:** `frontend/src/pages/Catalogo.jsx`  
**Problema:** Carga de resultados sin limit real.

**Solución:** Implementar paginación adecuada.

---

### 17. **Error Handling Inconsistente**
**Severidad:** 🟡 MEDIO  
**Ubicación:** Frontend completo  
**Problema:** Algunos endpoints validan errores, otros no.

**Solución:** Crear middleware centralizado de error handling.

---

### 18. **Falta de HTTPS en Desarrollo**
**Severidad:** 🟡 MEDIO  
**Ubicación:** Configuración de Vite  
**Problema:** El proxy en vite.config.js no usa HTTPS en desarrollo.

**Solución:** Forzar HTTPS en producción en Vercel.

---

### 19. **JWT Secret Débil Potencial**
**Severidad:** 🟡 MEDIO  
**Ubicación:** `backend/index.js` - Línea ~24  
**Problema:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
```

Si `process.env.JWT_SECRET` no es suficientemente largo (mínimo 32 caracteres).

**Solución:** Validar en startup:
```javascript
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}
```

---

### 20. **Falta de Logging y Auditoría**
**Severidad:** 🟡 MEDIO  
**Ubicación:** Todo el backend  
**Problema:** Solo hay console.log; no hay logging centralizado.

**Solución:** Usar Winston o Pino:
```javascript
const winston = require('winston');
const logger = winston.createLogger({ /* config */ });
logger.info(`Usuario ${userId} inició sesión`);
```

---

## 🟢 HALLAZGOS BAJOS

### 21. **Dependencias Desactualizadas**
**Severidad:** 🟢 BAJO  
**Ubicación:** package.json  
**Problema:** Algunas dependencias podrían estar desactualizadas.

**Recomendación:** Ejecutar `npm audit` y actualizar regularmente.

---

### 22. **Falta de Documentación API**
**Severidad:** 🟢 BAJO  
**Ubicación:** Backend  
**Problema:** No hay documentación de endpoints (OpenAPI/Swagger).

**Solución:** Implementar Swagger UI:
```bash
npm install swagger-ui-express swagger-jsdoc
```

---

### 23. **Falta de Tests**
**Severidad:** 🟢 BAJO  
**Ubicación:** Proyecto completo  
**Problema:** No hay tests unitarios ni de integración.

**Solución:** Añadir Jest + Supertest para backend.

---

### 24. **Estilos Hardcodeados en JSX**
**Severidad:** 🟢 BAJO  
**Ubicación:** `frontend/src/pages/Admin.jsx`  
**Problema:** Estilos inline en lugar de CSS modules o Tailwind.

**Solución:** Mover a CSS modules o usar Tailwind CSS.

---

### 25. **Falta de Environment de Desarrollo**
**Severidad:** 🟢 BAJO  
**Ubicación:** Raíz del proyecto  
**Problema:** No hay `.env.example`.

**Solución:**
```bash
cp .env .env.example
# Editar .env.example removiendo valores sensibles
```

---

## 🔧 ANÁLISIS POR COMPONENTE

### Backend (Express.js)

#### ✅ Puntos Positivos:
- Usa bcrypt para hash de contraseñas (salt rounds: 10 es adecuado)
- JWT para autenticación stateless
- Middleware de autenticación separado
- Manejo de transacciones en SQLite
- Variables de entorno para configuración
- Validación básica de campos requeridos

#### ❌ Puntos Negativos:
- CORS abierto a todos
- Sin rate limiting
- Sin validación profunda de entrada
- `exec()` para ejecutar scripts Python
- Sin HTTPS forzado
- Sin logging centralizado
- Credenciales por defecto hardcodeadas

---

### Frontend (React + Vite)

#### ✅ Puntos Positivos:
- Context API para state management
- Rutas protegidas con AdminRoute
- Manejo de tokens JWT
- fetchWithAuth centralizado
- Validaciones de cliente básicas

#### ❌ Puntos Negativos:
- Tokens almacenados en localStorage (vulnerable a XSS)
- Sin validación de email fuerte
- Sin offline support
- Estilos inconsistentes
- Sin error boundaries
- Búsqueda sin debounce

---

### Base de Datos (SQLite)

#### ✅ Puntos Positivos:
- WAL journal mode para mejor concurrencia
- Migrations automáticas de datos legacy
- Uso de prepared statements (evita SQLi)
- Campos UNIQUE en username, email, cuit

#### ❌ Puntos Negativos:
- Sin respaldos automáticos
- No escalable para múltiples servidores
- Sin versionamiento de schema
- Sin índices optimizados

---

### Deployment (Vercel)

#### ✅ Puntos Positivos:
- Separación de frontend y backend
- Rewrites configuradas correctamente
- Uso de build tools modernos

#### ❌ Puntos Negativos:
- Sin configuración de seguridad headers
- Sin control de variables de entorno documentado
- Sin plan de disaster recovery

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### Fase 1: Seguridad Crítica (1-2 semanas)
1. **Eliminar CORS abierto** → Restricción a FRONTEND_URL
2. **Implementar rate limiting** → 5 intentos por 15 minutos en login
3. **Cambiar admin password por defecto** → Forzar cambio en primer login
4. **Reemplazar `exec()` por `execFile()`** → Prevenir RCE
5. **Validar entrada** → Usar validator.js en todos los campos
6. **Agregar HTTPS headers** → helmet.js

### Fase 2: Autenticación (1-2 semanas)
7. **Implementar refresh tokens** → 15min access + 7d refresh
8. **Mejorar validación de contraseña** → 8+ chars, mixtos, símbolos
9. **Tokens en body, no en URL** → POST para reset password
10. **Revocar tokens en logout** → Blacklist o Redis

### Fase 3: Datos (2-3 semanas)
11. **Implementar respaldos** → Daily backup a GCS
12. **Migrar a PostgreSQL** → Render Database o similar
13. **Añadir auditoría** → Logging de cambios
14. **Encriptar datos sensibles** → Campos PII

### Fase 4: Monitoreo (1-2 semanas)
15. **Implementar logging** → Winston + Sentry
16. **Monitoreo de seguridad** → Alertas de intentos fallidos
17. **Métricas de performance** → New Relic o Datadog

---

## 📝 CHECKLIST DE ACCIONES

### Backend

- [ ] Instalar `express-rate-limit`
```bash
npm install express-rate-limit
```

- [ ] Instalar `helmet` para headers de seguridad
```bash
npm install helmet
```

- [ ] Instalar `validator` para validación
```bash
npm install validator
```

- [ ] Reemplazar `app.use(cors())` con configuración restringida
- [ ] Reemplazar `exec()` con `execFile()` en upload handler
- [ ] Agregar validación de email con validator.isEmail()
- [ ] Agregar validación de CUIT
- [ ] Mejora contraseña: mínimo 8 caracteres + requisitos
- [ ] Implementar blacklist de tokens para logout
- [ ] Cambiar expiración de token a 15 minutos
- [ ] Implementar refresh token endpoint
- [ ] Agregar helmet() para headers de seguridad
- [ ] Validar límites de parámetros paginación
- [ ] Crear middleware centralizado de error handling
- [ ] Agregar logging con Winston
- [ ] Crear .env.example con valores seguros

### Frontend

- [ ] Implementar endpoint de logout que haga POST a backend
- [ ] Cambiar localStorage a sessionStorage (o implementar cookie segura)
- [ ] Agregar Error Boundary component
- [ ] Implementar debounce en búsqueda
- [ ] Validar email con regex o validator
- [ ] Agregar CSRF tokens si es necesario
- [ ] Implementar refresh token logic
- [ ] Mejorar UX de errores con toasts/notificaciones

### Infraestructura

- [ ] Configurar variables de entorno en Vercel
- [ ] Implementar GitHub Actions para tests
- [ ] Configurar HTTPS en todos los dominios
- [ ] Establecer respaldos automáticos de BD
- [ ] Implementar CDN para assets estáticos
- [ ] Configurar monitoring y alertas
- [ ] Crear plan de disaster recovery

### Testing

- [ ] Agregar tests unitarios (Jest)
- [ ] Agregar tests de integración (Supertest)
- [ ] Agregar tests de seguridad (OWASP ZAP)
- [ ] Ejecutar npm audit regularmente

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Hallazgos | Severidad Máxima |
|-----------|-----------|------------------|
| Seguridad | 13 | 🔴 CRÍTICA |
| Performance | 2 | 🟡 MEDIO |
| Mantenibilidad | 5 | 🟢 BAJO |
| Testing | 1 | 🟢 BAJO |

**Puntuación de Seguridad:** 3/10 ⚠️  
**Recomendación:** No desplegar a producción sin abordar hallazgos críticos.

---

## 📞 Contacto y Próximos Pasos

Esta auditoría fue realizada el **2026-08-18**.

**Próximas acciones:**
1. Revisar este documento con el equipo
2. Priorizar hallazgos críticos
3. Crear issues en GitHub para cada hallazgo
4. Establecer timeline de remediación
5. Implementar en orden de severidad

---

**Auditor:** GitHub Copilot  
**Estado:** COMPLETADO  
**Confidencialidad:** PRIVADO
