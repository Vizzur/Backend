/**
 * Middleware de Autenticación JWT
 * 
 * Valida que las peticiones incluyan un token JWT válido
 */

const { verificarToken } = require('../config/auth');

/**
 * Middleware para proteger rutas
 * Verifica que el token sea válido y no esté expirado
 */
const autenticar = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere un token en el header Authorization',
        instructions: 'Envía: Authorization: Bearer <token>'
      });
    }

    // El formato debe ser "Bearer <token>"
    const partes = authHeader.split(' ');
    
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato inválido',
        message: 'El header Authorization debe tener formato: Bearer <token>'
      });
    }

    const token = partes[1];

    // Verificar token
    try {
      const decoded = verificarToken(token);
      
      // Guardar datos del usuario en request para usar en el controlador
      req.usuario = decoded;
      req.token = token;
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: error.message,
        detalles: error.message === 'Token expirado' 
          ? 'Por favor login nuevamente' 
          : 'El token no es válido'
      });
    }

  } catch (error) {
    console.error('[✗] Error en autenticar:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar roles (opcional)
 * Verifica que el usuario tenga un rol específico
 * 
 * @param {Array<string>} rolesPermitidos - Array de roles permitidos
 * @returns {Function} Middleware
 */
const autorizarPorRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
    }

    const rolUsuario = req.usuario.rol || 'usuario';
    
    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso prohibido',
        message: `Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`,
        rolUsuario
      });
    }

    next();
  };
};

module.exports = {
  autenticar,
  autorizarPorRol
};
