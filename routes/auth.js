/**
 * Rutas de Autenticación
 * 
 * Endpoints para login, verificación de token, perfil y logout
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { autenticar } = require('../middlewares/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login - Generar JWT
 *     description: |
 *       Realiza login con credenciales y genera un token JWT válido.
 *       
 *       **Uso del token:**
 *       - Almacena el token en el cliente
 *       - Incluye en todas las requests protegidas: Authorization: Bearer <token>
 *       - El token expira en 24 horas
 *       
 *       **Credenciales de prueba:**
 *       - Email: juan@example.com
 *       - Password: password123
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: Contraseña en texto plano
 *           examples:
 *             usuario1:
 *               value:
 *                 email: juan@example.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Login exitoso, token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login exitoso
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   description: JWT para usar en requests protegidas
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Pérez
 *                     email:
 *                       type: string
 *                       example: juan@example.com
 *                 expiresIn:
 *                   type: string
 *                   example: 24h
 *                   description: Tiempo de expiración del token
 *                 tokenType:
 *                   type: string
 *                   example: Bearer
 *                 instructions:
 *                   type: string
 *                   example: Usa este token con: Authorization: Bearer <token>
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Validación fallida
 *                 missingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Credenciales inválidas
 *                 message:
 *                   type: string
 *                   example: Email o contraseña incorrectos
 * /auth/perfil:
 *   get:
 *     summary: Obtener Perfil del Usuario Autenticado
 *     description: |
 *       Devuelve los datos del usuario autenticado.
 *       
 *       **Requiere autenticación:** Incluir token en Authorization header
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Perfil obtenido exitosamente
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                     activo:
 *                       type: boolean
 *                     foto_url:
 *                       type: string
 *       401:
 *         description: No autorizado - Token inválido o faltante
 * /auth/verificar:
 *   post:
 *     summary: Verificar Token
 *     description: Verifica si un token JWT es válido
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido o expirado
 * /auth/refresh:
 *   post:
 *     summary: Renovar Token
 *     description: |
 *       Genera un nuevo token usando el actual.
 *       
 *       **Requiere autenticación:** Incluir token en Authorization header
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: |
 *       Registra el logout del usuario.
 *       
 *       **Requiere autenticación:** Incluir token en Authorization header
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 */

// POST /auth/login - Login
router.post('/login', AuthController.login);

// POST /auth/verificar - Verificar token
router.post('/verificar', AuthController.verificarTokenEndpoint);

// GET /auth/perfil - Obtener perfil (protegido)
router.get('/perfil', autenticar, AuthController.obtenerPerfil);

// POST /auth/refresh - Renovar token (protegido)
router.post('/refresh', autenticar, AuthController.refreshToken);

// POST /auth/logout - Logout (protegido)
router.post('/logout', autenticar, AuthController.logout);

module.exports = router;
