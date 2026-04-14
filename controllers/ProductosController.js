/**
 * Controlador de Productos
 * 
 * Maneja la lógica de negocio para operaciones CRUD en productos.
 */

const { pool } = require('../config/database');

class ProductosController {
  /**
   * GET /productos
   * Obtiene lista de productos con filtrado y paginación
   */
  static async listar(req, res) {
    try {
      const { nombre, precio_min, precio_max, activo, page = 1, limit = 10, ordenar = 'fecha' } = req.query;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

      let baseQuery = `
        SELECT id, nombre, descripcion, precio, stock, activo, fecha_creacion 
        FROM productos 
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      // Filtro por nombre
      if (nombre && nombre.trim()) {
        baseQuery += ` AND nombre ILIKE $${paramIndex}`;
        params.push(`%${nombre.trim()}%`);
        paramIndex++;
      }

      // Filtro por precio mínimo
      if (precio_min !== undefined && precio_min !== '') {
        const minPrice = parseFloat(precio_min);
        if (!isNaN(minPrice)) {
          baseQuery += ` AND precio >= $${paramIndex}`;
          params.push(minPrice);
          paramIndex++;
        }
      }

      // Filtro por precio máximo
      if (precio_max !== undefined && precio_max !== '') {
        const maxPrice = parseFloat(precio_max);
        if (!isNaN(maxPrice)) {
          baseQuery += ` AND precio <= $${paramIndex}`;
          params.push(maxPrice);
          paramIndex++;
        }
      }

      // Filtro por activo
      if (activo !== undefined && (activo === 'true' || activo === 'false')) {
        baseQuery += ` AND activo = $${paramIndex}`;
        params.push(activo === 'true');
        paramIndex++;
      }

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as counted`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);
      const offset = (pageNum - 1) * limitNum;

      // Determinar columna de orden
      let orderColumn = 'fecha_creacion';
      if (ordenar === 'nombre') orderColumn = 'nombre';
      else if (ordenar === 'precio') orderColumn = 'precio';
      else if (ordenar === 'stock') orderColumn = 'stock';

      const finalQuery = `
        ${baseQuery}
        ORDER BY ${orderColumn} DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limitNum, offset);

      const result = await pool.query(finalQuery, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalRecords: total,
          totalPages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
        filters: {
          nombre: nombre || null,
          precio_min: precio_min || null,
          precio_max: precio_max || null,
          activo: activo ? (activo === 'true') : null,
        },
        message: `${result.rows.length} producto(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('[✗] Error al listar productos:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al consultar productos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /productos/:id
   * Obtiene un producto específico
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID debe ser un número positivo',
        });
      }

      const query = `
        SELECT id, nombre, descripcion, precio, stock, activo, fecha_creacion 
        FROM productos 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
          id: parseInt(id),
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Producto obtenido exitosamente',
      });
    } catch (error) {
      console.error('[✗] Error al obtener producto:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al consultar producto',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /productos
   * Crea un nuevo producto
   */
  static async crear(req, res) {
    try {
      const { nombre, descripcion, precio, stock = 0, activo = true } = req.body;

      if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido y no puede estar vacío',
        });
      }

      if (precio === undefined || precio === null) {
        return res.status(400).json({
          success: false,
          error: 'El precio es requerido',
        });
      }

      const precioNum = parseFloat(precio);
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'El precio debe ser un número positivo',
        });
      }

      const stockNum = parseInt(stock) || 0;
      if (stockNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'El stock no puede ser negativo',
        });
      }

      const query = `
        INSERT INTO productos (nombre, descripcion, precio, stock, activo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre, descripcion, precio, stock, activo, fecha_creacion
      `;

      const result = await pool.query(query, [
        nombre.trim(),
        descripcion || null,
        precioNum,
        stockNum,
        activo,
      ]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Producto creado exitosamente',
      });
    } catch (error) {
      console.error('[✗] Error al crear producto:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al crear producto',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /productos/:id
   * Actualiza un producto existente
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, stock, activo } = req.body;

      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID debe ser un número positivo',
        });
      }

      if (nombre === undefined && descripcion === undefined && precio === undefined && stock === undefined && activo === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar al menos un campo para actualizar',
          availableFields: ['nombre', 'descripcion', 'precio', 'stock', 'activo'],
        });
      }

      const checkQuery = 'SELECT id FROM productos WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
          id: parseInt(id),
        });
      }

      let updateQuery = 'UPDATE productos SET ';
      const params = [];
      let paramIndex = 1;
      const updatedFields = [];

      if (nombre !== undefined && nombre !== null) {
        if (nombre.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'El nombre no puede estar vacío',
          });
        }
        updateQuery += `nombre = $${paramIndex}, `;
        params.push(nombre.trim());
        paramIndex++;
        updatedFields.push('nombre');
      }

      if (descripcion !== undefined) {
        updateQuery += `descripcion = $${paramIndex}, `;
        params.push(descripcion || null);
        paramIndex++;
        updatedFields.push('descripcion');
      }

      if (precio !== undefined) {
        const precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'El precio debe ser un número positivo',
          });
        }
        updateQuery += `precio = $${paramIndex}, `;
        params.push(precioNum);
        paramIndex++;
        updatedFields.push('precio');
      }

      if (stock !== undefined) {
        const stockNum = parseInt(stock);
        if (isNaN(stockNum) || stockNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'El stock debe ser un número no negativo',
          });
        }
        updateQuery += `stock = $${paramIndex}, `;
        params.push(stockNum);
        paramIndex++;
        updatedFields.push('stock');
      }

      if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'El campo "activo" debe ser true o false',
          });
        }
        updateQuery += `activo = $${paramIndex}, `;
        params.push(activo);
        paramIndex++;
        updatedFields.push('activo');
      }

      updateQuery += `WHERE id = $${paramIndex} RETURNING id, nombre, descripcion, precio, stock, activo, fecha_creacion`;
      params.push(id);

      const result = await pool.query(updateQuery, params);

      res.json({
        success: true,
        data: result.rows[0],
        updatedFields: updatedFields,
        message: `Producto actualizado exitosamente (${updatedFields.join(', ')})`,
      });
    } catch (error) {
      console.error('[✗] Error al actualizar producto:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar producto',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /productos/:id
   * Marca un producto como inactivo (eliminación lógica)
   */
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID debe ser un número positivo',
        });
      }

      const checkQuery = 'SELECT id, nombre FROM productos WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
          id: parseInt(id),
        });
      }

      const productoEliminado = checkResult.rows[0];

      const deleteQuery = `
        UPDATE productos 
        SET activo = false 
        WHERE id = $1 
        RETURNING id, nombre
      `;
      await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente (marcado como inactivo)',
        deletedProduct: {
          id: productoEliminado.id,
          nombre: productoEliminado.nombre,
        },
      });
    } catch (error) {
      console.error('[✗] Error al eliminar producto:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar producto',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = ProductosController;
