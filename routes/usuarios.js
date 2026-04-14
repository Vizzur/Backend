/**
 * Rutas de Usuarios
 * 
 * Implementa endpoints CRUD para usuarios usando el controlador.
 * 
 * **⚠️ RUTAS PROTEGIDAS:**
 * - GET /usuarios - Requiere autenticación (JWT)
 * - GET /usuarios/:id - Requiere autenticación (JWT)
 */

const express = require('express');
const UsuariosController = require('../controllers/UsuariosController');
const { validateUsuario, validateId, validatePagination, errorHandler } = require('../middlewares/validators');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener lista de usuarios
 *     description: |
 *       Recupera una lista paginada de usuarios con opciones de filtrado.
 *       
 *       **⚠️ REQUIERE AUTENTICACIÓN:** Incluir token JWT en Authorization header
 *       
 *       Ejemplo: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (búsqueda parcial)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtrar por email (búsqueda parcial)
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *                 pagination:
 *                   $ref: '#/components/schemas/Paginacion'
 *       500:
 *         description: Error en servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Crear nuevo usuario
 *     description: Crea un nuevo usuario en la base de datos
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCrear'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: Email ya registrado
 *       500:
 *         description: Error en servidor
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     description: Recupera los detalles de un usuario específico
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en servidor
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza los datos de un usuario existente
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Nuevo
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juannuevo@example.com
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Validación fallida
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Email duplicado
 *       500:
 *         description: Error en servidor
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario de la base de datos
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en servidor
 */

// GET /usuarios - Listar usuarios (PROTEGIDO - requiere autenticación)
router.get('/', autenticar, validatePagination, UsuariosController.listar);

// GET /usuarios/:id - Obtener usuario (PROTEGIDO - requiere autenticación)
router.get('/:id', autenticar, validateId, UsuariosController.obtenerPorId);

// POST /usuarios - Crear usuario
router.post('/', validateUsuario, UsuariosController.crear);

// PUT /usuarios/:id - Actualizar usuario
router.put('/:id', validateId, UsuariosController.actualizar);

// DELETE /usuarios/:id - Eliminar usuario
router.delete('/:id', validateId, UsuariosController.eliminar);

module.exports = router;
