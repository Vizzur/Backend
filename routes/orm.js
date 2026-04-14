/**
 * Rutas ORM - Usuarios con Sequelize
 * 
 * Comparar con rutas/usuarios.js que usan SQL manual
 * para entender ventajas del ORM
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/sequelize');

/**
 * GET /orm/usuarios
 * 
 * Obtener lista de usuarios con Sequelize
 * (Equivalente a GET /usuarios pero con ORM)
 */
router.get('/orm/usuarios', async (req, res) => {
  try {
    // Parámetros de query
    const { nombre, email, activo, page = 1, limit = 10 } = req.query;
    
    // Validar límite
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Construir opciones de búsqueda con Sequelize
    const where = {};
    
    // Filtro por nombre (búsqueda parcial - case insensitive)
    if (nombre) {
      // Sequelize proporciona operadores como Op.iLike
      const { Op } = require('sequelize');
      where.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    
    // Filtro por email
    if (email) {
      const { Op } = require('sequelize');
      where.email = { [Op.iLike]: `%${email}%` };
    }
    
    // Filtro por estado activo
    if (activo !== undefined && activo !== '') {
      where.activo = activo === 'true' || activo === true;
    }
    
    // Ejecutar consulta con Sequelize
    const { count, rows } = await db.User.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      raw: true,  // Devolver JSON plano en lugar de instancias
      order: [['fecha_creacion', 'DESC']]
    });
    
    // Calcular metadatos de paginación
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;
    
    // Mapear formato de respuesta
    const usuariosMap = rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion,
      fecha_actualizacion: u.fecha_actualizacion
    }));
    
    res.json({
      success: true,
      source: 'Sequelize ORM',  // Indicador de que viene del ORM
      data: usuariosMap,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalRecords: count,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        nombre: nombre || null,
        email: email || null,
        activo: activo !== undefined ? (activo === 'true' || activo === true) : null
      },
      message: `${count} usuario(s) encontrado(s) [ORM]`
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar usuarios con ORM',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /orm/usuarios/:id
 * 
 * Obtener un usuario específico por ID CON SUS PEDIDOS ANIDADOS
 */
router.get('/orm/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    // Buscar usuario con Sequelize E INCLUIR PEDIDOS ANIDADOS
    const usuario = await db.User.findByPk(userId, {
      include: {
        model: db.Order,
        as: 'pedidos',
        attributes: ['id', 'numero_pedido', 'monto_total', 'estado', 'descripcion', 'notas', 'fecha_creacion', 'fecha_actualizacion']
      }
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        id: userId
      });
    }
    
    // Mapear respuesta con pedidos incluidos
    const usuarioMap = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
      fecha_creacion: usuario.fecha_creacion,
      fecha_actualizacion: usuario.fecha_actualizacion,
      pedidos: usuario.pedidos ? usuario.pedidos.map(p => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        monto_total: p.monto_total,
        estado: p.estado,
        descripcion: p.descripcion,
        notas: p.notas,
        fecha_pedido: p.fecha_creacion,
        fecha_creacion: p.fecha_creacion,
        fecha_actualizacion: p.fecha_actualizacion
      })) : []
    };
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      usuario: usuarioMap,
      totalPedidos: usuarioMap.pedidos.length,
      data: usuarioMap,
      message: 'Usuario con pedidos obtenido exitosamente [ORM]'
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/usuarios/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar usuario'
    });
  }
});

/**
 * GET /orm/usuarios/:id/pedidos
 * 
 * Obtener solo los pedidos de un usuario específico
 */
router.get('/orm/usuarios/:id/pedidos', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    // Verificar que el usuario existe
    const usuario = await db.User.findByPk(userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        id: userId
      });
    }
    
    // Obtener pedidos del usuario
    const pedidos = await db.Order.findAll({
      where: { usuario_id: userId },
      attributes: ['id', 'numero_pedido', 'monto_total', 'estado', 'descripcion', 'notas', 'fecha_creacion', 'fecha_actualizacion'],
      order: [['fecha_creacion', 'DESC']]
    });
    
    const pedidosMap = pedidos.map(p => ({
      id: p.id,
      numero_pedido: p.numero_pedido,
      monto_total: p.monto_total,
      estado: p.estado,
      descripcion: p.descripcion,
      notas: p.notas,
      fecha_pedido: p.fecha_creacion,
      fecha_creacion: p.fecha_creacion,
      fecha_actualizacion: p.fecha_actualizacion
    }));
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      usuario_id: userId,
      usuario_nombre: usuario.nombre,
      pedidos: pedidosMap,
      totalPedidos: pedidosMap.length,
      message: `${pedidosMap.length} pedido(s) encontrado(s) [ORM]`
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/usuarios/:id/pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar pedidos del usuario'
    });
  }
});

/**
 * POST /orm/usuarios
 * 
 * Crear nuevo usuario usando Sequelize
 * Sequelize valida automáticamente según el modelo
 */
router.post('/orm/usuarios', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Validaciones básicas antes de crear
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: nombre, email, password'
      });
    }
    
    // Validar email básico
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }
    
    // Crear usuario con Sequelize
    // Sequelize valida automáticamente según las reglas del modelo
    const usuario = await db.User.create({
      nombre,
      email,
      password_hash: password,  // En producción, hasher con bcrypt
      activo: true
    });
    
    res.status(201).json({
      success: true,
      statusCode: 201,
      source: 'Sequelize ORM',
      data: usuario.toJSON(),  // Usa método toJSON que oculta contraseña
      message: 'Usuario creado exitosamente con ORM'
    });
    
  } catch (error) {
    console.error('[✗] Error en POST /orm/usuarios:', error);
    
    // Manejar error de email duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado',
        field: 'email'
      });
    }
    
    // Manejar errores de validación de Sequelize
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
      error: 'Error al crear usuario'
    });
  }
});

/**
 * PUT /orm/usuarios/:id
 * 
 * Actualizar usuario con Sequelize
 */
router.put('/orm/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, activo } = req.body;
    
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    // Verificar que al menos un campo sea proporcionado
    if (!nombre && !email && activo === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar al menos un campo a actualizar'
      });
    }
    
    // Buscar usuario
    const usuario = await db.User.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Preparar datos a actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (activo !== undefined) updateData.activo = activo;
    
    // Actualizar con Sequelize
    await usuario.update(updateData);
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      data: usuario.toJSON(),
      message: 'Usuario actualizado exitosamente con ORM'
    });
    
  } catch (error) {
    console.error('[✗] Error en PUT /orm/usuarios/:id:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
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
      error: 'Error al actualizar usuario'
    });
  }
});

/**
 * DELETE /orm/usuarios/:id
 * 
 * Eliminar usuario con Sequelize
 */
router.delete('/orm/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = parseInt(id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    // Buscar usuario
    const usuario = await db.User.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Guardar datos antes de eliminar
    const deletedData = usuario.toJSON();
    
    // Eliminar con Sequelize
    await usuario.destroy();
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      message: 'Usuario eliminado exitosamente con ORM',
      deletedUser: deletedData
    });
    
  } catch (error) {
    console.error('[✗] Error en DELETE /orm/usuarios/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
});

/**
 * GET /orm/comparison
 * 
 * Comparación lado a lado entre SQL manual y ORM
 * Muestra las diferencias en código y resultados
 */
router.get('/orm/comparison', async (req, res) => {
  try {
    const sqlClient = require('../config/database');
    const { db: sequelizeDb } = require('../config/sequelize');
    
    // Obtener datos con SQL manual
    const sqlResult = await sqlClient.pool.query(
      `SELECT id, nombre, email, activo, fecha_creacion, fecha_actualizacion 
       FROM usuarios ORDER BY id LIMIT 5`
    );
    
    // Obtener datos con ORM (Sequelize)
    const ormResult = await sequelizeDb.User.findAll({
      limit: 5,
      order: [['id', 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      comparison: {
        sql: {
          method: 'pg.pool.query("SELECT ...", [])',
          approach: 'SQL manual con prepared statements',
          result: sqlResult.rows,
          count: sqlResult.rows.length
        },
        orm: {
          method: 'db.User.findAll({ limit: 5 })',
          approach: 'Sequelize ORM con métodos del modelo',
          result: ormResult,
          count: ormResult.length
        },
        dataMatches: JSON.stringify(sqlResult.rows) === JSON.stringify(ormResult),
        note: 'Ambos métodos devuelven exactamente los mismos datos'
      }
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Error al comparar SQL vs ORM'
    });
  }
});

/**
 * GET /orm/productos
 * 
 * Obtener lista de productos con Sequelize
 */
router.get('/orm/productos', async (req, res) => {
  try {
    const { nombre, precio_min, precio_max, activo, page = 1, limit = 10 } = req.query;
    
    // Validar límite de paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Construir condiciones de búsqueda
    const where = {};
    
    if (nombre) {
      const { Op } = require('sequelize');
      where.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    
    if (precio_min || precio_max) {
      const { Op } = require('sequelize');
      where.precio = {};
      if (precio_min) where.precio[Op.gte] = parseFloat(precio_min);
      if (precio_max) where.precio[Op.lte] = parseFloat(precio_max);
    }
    
    if (activo !== undefined && activo !== '') {
      where.activo = activo === 'true' || activo === true;
    }
    
    // Ejecutar consulta usando pool directo para productos (no hay modelo Sequelize)
    const { pool } = require('../config/database');
    const query = `
      SELECT id, nombre, descripcion, precio, stock, activo, fecha_creacion, fecha_actualizacion
      FROM productos
      WHERE 1=1
      ${nombre ? "AND LOWER(nombre) LIKE LOWER($1)" : ''}
      ${precio_min ? `AND precio >= ${precio_min}` : ''}
      ${precio_max ? `AND precio <= ${precio_max}` : ''}
      ${activo !== undefined && activo !== '' ? `AND activo = ${activo === 'true' || activo === true}` : ''}
      ORDER BY fecha_creacion DESC
      LIMIT $${nombre ? '2' : '1'} OFFSET $${nombre ? '3' : '2'}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count FROM productos
      WHERE 1=1
      ${nombre ? "AND LOWER(nombre) LIKE LOWER($1)" : ''}
      ${precio_min ? `AND precio >= ${precio_min}` : ''}
      ${precio_max ? `AND precio <= ${precio_max}` : ''}
      ${activo !== undefined && activo !== '' ? `AND activo = ${activo === 'true' || activo === true}` : ''}
    `;
    
    const params = [];
    if (nombre) params.push(`%${nombre}%`);
    params.push(limitNum);
    params.push(offset);
    
    const countParams = [];
    if (nombre) countParams.push(`%${nombre}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    const count = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(query, params);
    const productos = result.rows;
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      source: 'SQL Directo (pool)',
      data: productos,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalRecords: count,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      },
      message: `${count} producto(s) encontrado(s)`
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar productos'
    });
  }
});

/**
 * GET /orm/productos/:id
 * 
 * Obtener producto por ID
 */
router.get('/orm/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productoId = parseInt(id);
    
    if (isNaN(productoId) || productoId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    const { pool } = require('../config/database');
    const query = `
      SELECT id, nombre, descripcion, precio, stock, activo, fecha_creacion, fecha_actualizacion
      FROM productos
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [productoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      source: 'SQL Directo (pool)',
      data: result.rows[0],
      message: 'Producto obtenido exitosamente'
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/productos/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar producto'
    });
  }
});

/**
 * GET /orm/pedidos
 * 
 * Obtener lista de pedidos con Sequelize ORM
 */
router.get('/orm/pedidos', async (req, res) => {
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
      offset,
      limit: limitNum,
      include: {
        model: db.User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email']
      },
      order: [['fecha_creacion', 'DESC']],
      raw: false
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    const pedidosMap = rows.map(p => ({
      id: p.id,
      numero_pedido: p.numero_pedido,
      usuario: p.usuario ? {
        id: p.usuario.id,
        nombre: p.usuario.nombre,
        email: p.usuario.email
      } : null,
      monto_total: p.monto_total,
      estado: p.estado,
      descripcion: p.descripcion,
      notas: p.notas,
      fecha_creacion: p.fecha_creacion,
      fecha_actualizacion: p.fecha_actualizacion
    }));
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      data: pedidosMap,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalRecords: count,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      },
      filters: {
        estado: estado || null
      },
      message: `${count} pedido(s) encontrado(s) [ORM]`
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar pedidos'
    });
  }
});

/**
 * GET /orm/pedidos/:id
 * 
 * Obtener pedido por ID con Sequelize ORM
 */
router.get('/orm/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoId = parseInt(id);
    
    if (isNaN(pedidoId) || pedidoId < 1) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo'
      });
    }
    
    const pedido = await db.Order.findByPk(pedidoId, {
      include: {
        model: db.User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email']
      }
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
    
    const pedidoData = {
      id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      usuario: pedido.usuario ? {
        id: pedido.usuario.id,
        nombre: pedido.usuario.nombre,
        email: pedido.usuario.email
      } : null,
      monto_total: pedido.monto_total,
      estado: pedido.estado,
      descripcion: pedido.descripcion,
      notas: pedido.notas,
      fecha_creacion: pedido.fecha_creacion,
      fecha_actualizacion: pedido.fecha_actualizacion
    };
    
    res.json({
      success: true,
      source: 'Sequelize ORM',
      data: pedidoData,
      message: 'Pedido obtenido exitosamente [ORM]'
    });
    
  } catch (error) {
    console.error('[✗] Error en GET /orm/pedidos/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar pedido'
    });
  }
});

module.exports = router;
