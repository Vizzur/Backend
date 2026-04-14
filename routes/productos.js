/**
 * Rutas de Productos
 * 
 * Implementa endpoints CRUD para productos usando el controlador.
 */

const express = require('express');
const ProductosController = require('../controllers/ProductosController');
const { validateProducto, validateId, validatePagination, errorHandler } = require('../middlewares/validators');

const router = express.Router();

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtener lista de productos
 *     description: Recupera una lista paginada de productos con opciones de filtrado y búsqueda
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (búsqueda parcial)
 *       - in: query
 *         name: precio_min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Solo productos activos
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
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [nombre, precio, stock, fecha]
 *           default: fecha
 *         description: Campo para ordenar resultados
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Producto'
 *                 pagination:
 *                   $ref: '#/components/schemas/Paginacion'
 *       500:
 *         description: Error en servidor
 *   post:
 *     summary: Crear nuevo producto
 *     description: Crea un nuevo producto en el inventario
 *     tags:
 *       - Productos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoCrear'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Validación fallida
 *       500:
 *         description: Error en servidor
 * /productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     description: Recupera los detalles de un producto específico
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Producto'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en servidor
 *   put:
 *     summary: Actualizar producto
 *     description: Actualiza los datos de un producto existente
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop Dell XPS 15
 *               descripcion:
 *                 type: string
 *                 example: Laptop mejorada de 15 pulgadas
 *               precio:
 *                 type: number
 *                 format: decimal
 *                 example: 1399.99
 *               stock:
 *                 type: integer
 *                 example: 40
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Validación fallida
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en servidor
 *   delete:
 *     summary: Eliminar producto
 *     description: Elimina un producto del inventario (eliminación lógica - marca como inactivo)
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
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
 *         description: Producto no encontrado
 *       500:
 *         description: Error en servidor
 */

// GET /productos - Listar productos
router.get('/', validatePagination, ProductosController.listar);

// GET /productos/:id - Obtener producto
router.get('/:id', validateId, ProductosController.obtenerPorId);

// POST /productos - Crear producto
router.post('/', validateProducto, ProductosController.crear);

// PUT /productos/:id - Actualizar producto
router.put('/:id', validateId, ProductosController.actualizar);

// DELETE /productos/:id - Eliminar producto
router.delete('/:id', validateId, ProductosController.eliminar);

module.exports = router;
