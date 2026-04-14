/**
 * Rutas de Pedidos
 * 
 * Implementa endpoints CRUD para pedidos usando el controlador.
 */

const express = require('express');
const PedidosController = require('../controllers/PedidosController');
const { validatePedido, validateId, validatePagination, errorHandler } = require('../middlewares/validators');

const router = express.Router();

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Obtener lista de pedidos
 *     description: Recupera una lista paginada de todos los pedidos con información del usuario
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO]
 *         description: Filtrar por estado del pedido
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
 *         description: Lista de pedidos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Pedido'
 *                 pagination:
 *                   $ref: '#/components/schemas/Paginacion'
 *       500:
 *         description: Error en servidor
 *   post:
 *     summary: Crear nuevo pedido
 *     description: Crea un nuevo pedido para un usuario existente
 *     tags:
 *       - Pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PedidoCrear'
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Validación fallida
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Número de pedido duplicado
 *       500:
 *         description: Error en servidor
 * /pedidos/{id}:
 *   get:
 *     summary: Obtener pedido por ID
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido obtenido exitosamente
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error en servidor
 *   put:
 *     summary: Actualizar pedido
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO]
 *               descripcion:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido actualizado exitosamente
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error en servidor
 *   delete:
 *     summary: Eliminar pedido
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido eliminado exitosamente
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error en servidor
 * /usuarios/{userId}/pedidos:
 *   get:
 *     summary: Obtener pedidos de un usuario
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Pedidos del usuario obtenidos exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en servidor
 */

// GET /pedidos - Listar todos los pedidos
router.get('/', validatePagination, PedidosController.listar);

// GET /pedidos/:id - Obtener pedido por ID
router.get('/:id', validateId, PedidosController.obtenerPorId);

// GET /pedidos/usuario/:userId - Obtener pedidos de un usuario específico
router.get('/usuario/:userId', validateId, PedidosController.obtenerPorUsuario);

// POST /pedidos - Crear nuevo pedido
router.post('/', validatePedido, PedidosController.crear);

// PUT /pedidos/:id - Actualizar pedido
router.put('/:id', validateId, PedidosController.actualizar);

// DELETE /pedidos/:id - Eliminar pedido
router.delete('/:id', validateId, PedidosController.eliminar);

module.exports = router;
