/**
 * Configuración de Autenticación JWT
 * 
 * Define parámetros de JWT y funciones para generar/verificar tokens
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_cambiar_en_produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';  // 24 horas por defecto

/**
 * Generar JWT para un usuario
 * 
 * @param {Object} usuario - Datos del usuario
 * @param {number} usuario.id - ID del usuario
 * @param {string} usuario.email - Email del usuario
 * @param {string} usuario.nombre - Nombre del usuario
 * @returns {string} Token JWT
 */
function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol || 'usuario'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'Backend-API',
    audience: 'usuarios'
  });
}

/**
 * Verificar y decodificar JWT
 * 
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Datos decodificados del token
 * @throws {Error} Si el token es inválido o está expirado
 */
function verificarToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw error;
    }
  }
}

/**
 * Decodificar token sin verificar (solo para debugging)
 * 
 * @param {string} token - Token JWT
 * @returns {Object} Datos decodificados
 */
function decodificarToken(token) {
  return jwt.decode(token);
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRATION,
  generarToken,
  verificarToken,
  decodificarToken
};
