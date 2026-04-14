/**
 * Controlador de Autenticación
 * 
 * Maneja login, logout y operaciones de autenticación
 */

const { pool } = require('../config/database');
const { db } = require('../config/sequelize');
const { generarToken, verificarToken, JWT_EXPIRATION } = require('../config/auth');

class AuthController {
  /**
   * Login - Generar JWT
   * 
   * Valida credenciales y genera un token JWT
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Validación fallida',
          missingFields: [
            !email && 'email',
            !password && 'password'
          ].filter(Boolean),
          message: 'Email y contraseña son requeridos'
        });
      }

      // Validar formato de email
      if (!email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Email inválido',
          message: 'El email debe ser válido'
        });
      }

      // Buscar usuario en BD
      const usuarioResult = await pool.query(
        'SELECT id, nombre, email, password_hash, activo FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
      );

      if (usuarioResult.rows.length === 0) {
        // No devolver que el email no existe por seguridad
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      const usuario = usuarioResult.rows[0];

      // Validar que el usuario esté activo
      if (!usuario.activo) {
        return res.status(403).json({
          success: false,
          error: 'Usuario inactivo',
          message: 'La cuenta ha sido desactivada. Contacta al administrador.'
        });
      }

      // Validar contraseña (en producción, usar bcrypt o similar)
      // Por ahora, comparación simple
      if (usuario.password_hash !== password) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      // Generar JWT
      const token = generarToken({
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        },
        expiresIn: JWT_EXPIRATION,
        tokenType: 'Bearer',
        instructions: 'Usa este token con: Authorization: Bearer <token>'
      });

    } catch (error) {
      console.error('[✗] Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error al intentar login',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verificar Token
   * 
   * Verifica si un token es válido sin hacer logout
   */
  static async verificarTokenEndpoint(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token requerido'
        });
      }

      try {
        const decoded = verificarToken(token);
        
        res.json({
          success: true,
          message: 'Token válido',
          usuario: decoded,
          expiresIn: JWT_EXPIRATION
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Token inválido',
          message: error.message
        });
      }

    } catch (error) {
      console.error('[✗] Error en verificarTokenEndpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar token'
      });
    }
  }

  /**
   * Obtener Perfil del Usuario Autenticado
   * 
   * Obtiene los datos del usuario basado en el token
   */
  static async obtenerPerfil(req, res, next) {
    try {
      // req.usuario viene del middleware de autenticación
      const usuario = req.usuario;

      // Obtener información completa del usuario de la BD
      const usuarioResult = await pool.query(
        'SELECT id, nombre, email, activo, fecha_creacion, foto_url FROM usuarios WHERE id = $1',
        [usuario.id]
      );

      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const usuarioCompleto = usuarioResult.rows[0];

      res.json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        usuario: usuarioCompleto,
        token: {
          usuario: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre
        }
      });

    } catch (error) {
      console.error('[✗] Error en obtenerPerfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener perfil'
      });
    }
  }

  /**
   * Refresh Token
   * 
   * Genera un nuevo token usando el actual
   */
  static async refreshToken(req, res, next) {
    try {
      // req.usuario viene del middleware de autenticación
      const usuario = req.usuario;

      // Generar nuevo token
      const nuevoToken = generarToken({
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      });

      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        token: nuevoToken,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        },
        expiresIn: JWT_EXPIRATION
      });

    } catch (error) {
      console.error('[✗] Error en refreshToken:', error);
      res.status(500).json({
        success: false,
        error: 'Error al renovar token'
      });
    }
  }

  /**
   * Logout (opcional - para registro en auditoría)
   * 
   * Registra el logout en auditoría (el token sigue siendo válido)
   */
  static async logout(req, res, next) {
    try {
      const usuario = req.usuario;

      // En una aplicación real, aquí guardarías el token en una blacklist
      // o registrarías el logout en una tabla de auditoría

      res.json({
        success: true,
        message: 'Logout exitoso',
        usuario: usuario.email
      });

    } catch (error) {
      console.error('[✗] Error en logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error al hacer logout'
      });
    }
  }
}

module.exports = AuthController;
