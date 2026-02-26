/**
 * Rutas de Pedidos (Orders) con Sequelize
 * 
 * Demuestra el uso de relaciones:
 * - GET /orm/usuarios/:id/pedidos - Pedidos de un usuario
 * - GET /orm/pedidos - Listar todos los pedidos con usuario
 * - GET /orm/usuario/:id - Usuario con sus pedidos anidados
 * - POST /orm/pedidos - Crear pedido para usuario
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/sequelize');

/**
 * GET /orm/usuario/:id - Usuario con todos sus pedidos anidados
 * 
 * Usa: include() para traer relación 'pedidos'
 * Esto hace 1 query en lugar de N+1 queries
 */
router.get('/orm/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'ID debe ser número positivo'
      });
    }
    
    // Traer usuario con sus pedidos en UNA sola consulta
    const usuario = await db.User.findByPk(userId, {
      include: [
        {
          association: 'pedidos'  // Alias definido en relación
        }
      ]
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      source: 'Sequelize ORM con Include',
      usuario: usuario.toJSON(),
      totalPedidos: usuario.pedidos ? usuario.pedidos.length : 0,
      message: `Usuario con ${usuario.pedidos ? usuario.pedidos.length : 0} pedido(s)`
    });
    
  } catch (error) {
    console.error('[✗] Error GET /orm/usuario/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario con pedidos'
    });
  }
});

/**
 * GET /orm/usuarios/:id/pedidos - Pedidos de un usuario específico
 * 
 * Alternativa a include(), usando where directamente
 */
router.get('/orm/usuarios/:id/pedidos', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query;  // Filtrar por estado (opcional)
    
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'ID debe ser número positivo'
      });
    }
    
    // Filtros opcionales
    const where = { usuario_id: userId };
    if (estado) {
      where.estado = estado.toUpperCase();
    }
    
    // Traer pedidos del usuario
    const pedidos = await db.Order.findAll({
      where,
      include: [
        {
          association: 'usuario',
          attributes: ['id', 'nombre', 'email']  // Solo ciertos campos
        }
      ],
      order: [['fecha_pedido', 'DESC']]
    });
    
    // Verificar que el usuario existe
    const usuario = await db.User.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      source: 'Sequelize ORM con Include',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      },
      pedidos,
      totalPedidos: pedidos.length,
      filtros: {
        estado: estado || null
      }
    });
    
  } catch (error) {
    console.error('[✗] Error GET /orm/usuarios/:id/pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos de usuario'
    });
  }
});

/**
 * GET /orm/pedidos - Listar todos los pedidos con información de usuario
 * 
 * Usa include() para no hacer N+1 queries
 */
router.get('/orm/pedidos', async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Filtros
    const where = {};
    if (estado) {
      where.estado = estado.toUpperCase();
    }
    
    // Consulta con relación (evita N+1)
    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        {
          association: 'usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      offset,
      limit: limitNum,
      order: [['fecha_pedido', 'DESC']]
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      source: 'Sequelize ORM con Include',
      data: rows,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalRecords: count,
        totalPages,
        hasNextPage: pageNum < totalPages
      },
      filtros: {
        estado: estado || null
      }
    });
    
  } catch (error) {
    console.error('[✗] Error GET /orm/pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos'
    });
  }
});

/**
 * POST /orm/pedidos - Crear nuevo pedido para un usuario
 * 
 * Validaciones automáticas del modelo
 */
router.post('/orm/pedidos', async (req, res) => {
  try {
    const { usuario_id, numero_pedido, descripcion, monto_total, estado } = req.body;
    
    // Validar usuario existe
    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        error: 'usuario_id requerido'
      });
    }
    
    const usuario = await db.User.findByPk(usuario_id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Crear pedido
    const pedido = await db.Order.create({
      usuario_id,
      numero_pedido,
      descripcion,
      monto_total,
      estado: estado || 'PENDIENTE'
    });
    
    // Traer el pedido con usuario para respuesta
    const pedidoConUsuario = await db.Order.findByPk(pedido.id, {
      include: [
        {
          association: 'usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      statusCode: 201,
      source: 'Sequelize ORM',
      data: pedidoConUsuario.toJSON(),
      message: 'Pedido creado exitosamente'
    });
    
  } catch (error) {
    console.error('[✗] Error POST /orm/pedidos:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Número de pedido ya existe'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al crear pedido'
    });
  }
});

/**
 * GET /orm/relaciones - Endpoint de demostración
 * 
 * Muestra:
 * 1. Usuario sin include (solo usuario)
 * 2. Usuario con include (usuario + pedidos)
 * 3. Diferencia en los datos
 */
router.get('/orm/relaciones', async (req, res) => {
  try {
    // Obtener primer usuario (idealmente con al menos 1 pedido)
    const usuarioSinInclude = await db.User.findOne({
      raw: true
    });
    
    if (!usuarioSinInclude) {
      return res.status(404).json({
        success: false,
        error: 'No hay usuarios en la base de datos'
      });
    }
    
    // Mismo usuario pero CON pedidos
    const usuarioConInclude = await db.User.findByPk(usuarioSinInclude.id, {
      include: [
        {
          association: 'pedidos'
        }
      ]
    });
    
    res.json({
      success: true,
      comparison: {
        sinInclude: {
          metodo: 'User.findOne({ raw: true })',
          data: usuarioSinInclude,
          tienePedidos: false,
          descripcion: 'Solo datos del usuario, sin relaciones'
        },
        conInclude: {
          metodo: 'User.findByPk(id, { include: [{ association: "pedidos" }] })',
          data: usuarioConInclude.toJSON(),
          tienePedidos: usuarioConInclude.pedidos.length > 0,
          totalPedidos: usuarioConInclude.pedidos.length,
          descripcion: 'Usuario + todos sus pedidos en una sola consulta'
        }
      },
      nota: 'Usa include() para traer relaciones eficientemente'
    });
    
  } catch (error) {
    console.error('[✗] Error GET /orm/relaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al demostrar relaciones'
    });
  }
});

/**
 * PUT /orm/pedidos/:id - Actualizar pedido
 */
router.put('/orm/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, descripcion, notas } = req.body;
    
    const pedido = await db.Order.findByPk(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    // Actualizar campos permitidos
    if (estado) pedido.estado = estado;
    if (descripcion !== undefined) pedido.descripcion = descripcion;
    if (notas !== undefined) pedido.notas = notas;
    
    await pedido.save();
    
    // Traer con usuario
    const pedidoActualizado = await db.Order.findByPk(id, {
      include: [{ association: 'usuario', attributes: ['id', 'nombre', 'email'] }]
    });
    
    res.json({
      success: true,
      data: pedidoActualizado.toJSON(),
      message: 'Pedido actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('[✗] Error PUT /orm/pedidos/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar pedido'
    });
  }
});

/**
 * DELETE /orm/pedidos/:id - Eliminar pedido
 */
router.delete('/orm/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await db.Order.findByPk(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    const deletedData = pedido.toJSON();
    await pedido.destroy();
    
    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente',
      deletedPedido: deletedData
    });
    
  } catch (error) {
    console.error('[✗] Error DELETE /orm/pedidos/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar pedido'
    });
  }
});

module.exports = router;
