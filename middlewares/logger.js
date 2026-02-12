const fs = require('fs');
const path = require('path');

// Ruta del archivo de logs
const logFilePath = path.join(__dirname, '../logs/log.txt');

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
function getDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Obtiene la hora actual en formato HH:MM:SS
 */
function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', { hour12: false });
}

/**
 * Registra un evento en el archivo de log
 * @param {string} route - Ruta accedida
 * @param {string} method - Método HTTP (GET, POST, etc.)
 * @param {string} ip - Dirección IP del cliente
 * @param {string} statusCode - Código de estado HTTP
 */
function logAccess(route, method = 'GET', ip = '127.0.0.1', statusCode = 200) {
  const date = getDate();
  const time = getTime();
  
  const logEntry = `[${date}] [${time}] ${method} ${route} - IP: ${ip} - Status: ${statusCode}\n`;
  
  // Usar fs.appendFile para agregar líneas al archivo
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log:', err);
    } else {
      console.log(`✓ Acceso registrado: ${route}`);
    }
  });
}

/**
 * Middleware para registrar automáticamente acceso a rutas
 * Debe utilizarse en express: app.use(loggerMiddleware)
 */
function loggerMiddleware(req, res, next) {
  // Obtener IP del cliente
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const method = req.method;
  const route = req.originalUrl || req.url;
  
  // Capturar el código de estado después de que la respuesta se envíe
  res.on('finish', () => {
    logAccess(route, method, ip, res.statusCode);
  });
  
  next();
}

module.exports = {
  logAccess,
  loggerMiddleware
};
