/**
 * Controlador de Pedidos
 * 
 * Maneja la lógica de negocio para operaciones CRUD en pedidos.
 * Usa Sequelize ORM en lugar de SQL directo.
 */

const { db } = require('../config/sequelize');

class PedidosController {
  /**
   * GET /pedidos
   * Obtiene lista de todos los pedidos
   */
  static async listar(req, res) {
    try {
      const { estado, page = 1, limit = 10 } = req.query;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      const where = {};
      if (estado) {
        where.estado = estado.toUpperCase();
      }

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
        data: rows,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalRecords: count,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        },
        filtros: {
          estado: estado || null
        }
      });
    } catch (error) {
      console.error('[✗] Error al listar pedidos:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al obtener pedidos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /pedidos/:id
   * Obtiene un pedido específico
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const pedido = await db.Order.findByPk(id, {
        include: [
          {
            association: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ]
      });

      if (!pedido) {
        return res.status(404).json({
          success: false,
          error: 'Pedido no encontrado',
          id: parseInt(id)
        });
      }

      res.json({
        success: true,
        data: pedido.toJSON(),
        message: 'Pedido obtenido exitosamente'
      });
    } catch (error) {
      console.error('[✗] Error al obtener pedido:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al obtener pedido',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /usuarios/:userId/pedidos
   * Obtiene pedidos de un usuario específico
   */
  static async obtenerPorUsuario(req, res) {
    try {
      const { userId } = req.params;
      const { estado } = req.query;

      if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID de usuario debe ser un número positivo'
        });
      }

      // Verificar que el usuario existe
      const usuario = await db.User.findByPk(userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const where = { usuario_id: userId };
      if (estado) {
        where.estado = estado.toUpperCase();
      }

      const pedidos = await db.Order.findAll({
        where,
        include: [
          {
            association: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['fecha_pedido', 'DESC']]
      });

      res.json({
        success: true,
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
      console.error('[✗] Error al obtener pedidos de usuario:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al obtener pedidos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /usuarios/:userId
   * Obtiene usuario con todos sus pedidos anidados
   */
  static async obtenerUsuarioConPedidos(req, res) {
    try {
      const { userId } = req.params;

      if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID de usuario debe ser un número positivo'
        });
      }

      const usuario = await db.User.findByPk(userId, {
        include: [
          {
            association: 'pedidos'
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
        usuario: usuario.toJSON(),
        totalPedidos: usuario.pedidos ? usuario.pedidos.length : 0,
        message: `Usuario con ${usuario.pedidos ? usuario.pedidos.length : 0} pedido(s)`
      });
    } catch (error) {
      console.error('[✗] Error al obtener usuario con pedidos:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al obtener usuario con pedidos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /pedidos
   * Crea un nuevo pedido
   */
  static async crear(req, res) {
    try {
      const { usuario_id, numero_pedido, descripcion, monto_total, estado } = req.body;

      if (!usuario_id) {
        return res.status(400).json({
          success: false,
          error: 'usuario_id es requerido'
        });
      }

      if (!numero_pedido) {
        return res.status(400).json({
          success: false,
          error: 'numero_pedido es requerido'
        });
      }

      if (monto_total === undefined || monto_total === null) {
        return res.status(400).json({
          success: false,
          error: 'monto_total es requerido'
        });
      }

      const usuario = await db.User.findByPk(usuario_id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const pedido = await db.Order.create({
        usuario_id,
        numero_pedido,
        descripcion,
        monto_total,
        estado: estado || 'PENDIENTE'
      });

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
        data: pedidoConUsuario.toJSON(),
        message: 'Pedido creado exitosamente'
      });
    } catch (error) {
      console.error('[✗] Error al crear pedido:', error.message);

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
        error: 'Error al crear pedido',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /pedidos/:id
   * Actualiza un pedido existente
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { estado, descripcion, notas } = req.body;

      if (!estado && !descripcion && notas === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar al menos un campo para actualizar',
          availableFields: ['estado', 'descripcion', 'notas']
        });
      }

      const pedido = await db.Order.findByPk(id);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          error: 'Pedido no encontrado'
        });
      }

      if (estado) pedido.estado = estado.toUpperCase();
      if (descripcion !== undefined) pedido.descripcion = descripcion;
      if (notas !== undefined) pedido.notas = notas;

      await pedido.save();

      const pedidoActualizado = await db.Order.findByPk(id, {
        include: [
          {
            association: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: pedidoActualizado.toJSON(),
        message: 'Pedido actualizado exitosamente'
      });
    } catch (error) {
      console.error('[✗] Error al actualizar pedido:', error.message);

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
        error: 'Error al actualizar pedido',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * DELETE /pedidos/:id
   * Elimina un pedido
   */
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const pedido = await db.Order.findByPk(id);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          error: 'Pedido no encontrado'
        });
      }

      const pedidoEliminado = pedido.toJSON();
      await pedido.destroy();

      res.json({
        success: true,
        message: 'Pedido eliminado exitosamente',
        deletedPedido: {
          id: pedidoEliminado.id,
          numero_pedido: pedidoEliminado.numero_pedido,
          estado: pedidoEliminado.estado
        }
      });
    } catch (error) {
      console.error('[✗] Error al eliminar pedido:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar pedido',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PedidosController;
