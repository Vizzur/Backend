/**
 * Controlador de Usuarios
 * 
 * Maneja toda la lógica de negocio relacionada con usuarios.
 * Separa la lógica de las rutas para código más limpio y testeable.
 */

const { pool, executeTransaction } = require('../config/database');

class UsuariosController {
  /**
   * GET /usuarios
   * Obtiene lista de usuarios con filtrado y paginación
   * 
   * Query params:
   *  - nombre: Filtrar por nombre (búsqueda parcial)
   *  - email: Filtrar por email (búsqueda parcial)
   *  - activo: true/false para filtrar por estado
   *  - page: Número de página (default: 1)
   *  - limit: Registros por página (default: 10)
   */
  static async listar(req, res) {
    try {
      const { nombre, email, activo, page = 1, limit = 10 } = req.query;

      // Convertir a números para paginación
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

      // Construir consulta dinámicamente
      let baseQuery = 'SELECT id, nombre, email, activo, fecha_creacion, fecha_actualizacion FROM usuarios WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Filtro por nombre (búsqueda parcial)
      if (nombre && nombre.trim()) {
        baseQuery += ` AND nombre ILIKE $${paramIndex}`;
        params.push(`%${nombre.trim()}%`);
        paramIndex++;
      }

      // Filtro por email (búsqueda parcial)
      if (email && email.trim()) {
        baseQuery += ` AND email ILIKE $${paramIndex}`;
        params.push(`%${email.trim()}%`);
        paramIndex++;
      }

      // Filtro por estado activo
      if (activo !== undefined && (activo === 'true' || activo === 'false')) {
        baseQuery += ` AND activo = $${paramIndex}`;
        params.push(activo === 'true');
        paramIndex++;
      }

      // Contar total de registros
      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as counted`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Calcular paginación
      const totalPages = Math.ceil(total / limitNum);
      const offset = (pageNum - 1) * limitNum;

      // Consulta final con orden y paginación
      const finalQuery = `
        ${baseQuery}
        ORDER BY fecha_creacion DESC
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
          email: email || null,
          activo: activo ? (activo === 'true') : null,
        },
        message: `${result.rows.length} usuario(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('[✗] Error al listar usuarios:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al consultar usuarios',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /usuarios/:id
   * Obtiene un usuario específico por ID
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      // Validar que id sea número
      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID debe ser un número positivo',
        });
      }

      const query = 'SELECT id, nombre, email, activo, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = $1';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          id: parseInt(id),
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Usuario obtenido exitosamente',
      });
    } catch (error) {
      console.error('[✗] Error al obtener usuario:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al consultar usuario',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /usuarios
   * Crea un nuevo usuario
   */
  static async crear(req, res) {
    try {
      const { nombre, email, password_hash, activo = true } = req.body;

      // Validaciones básicas (el middleware también valida)
      if (!nombre || !email || !password_hash) {
        return res.status(400).json({
          success: false,
          error: 'Los campos nombre, email y password_hash son requeridos',
        });
      }

      // Ejecutar transacción: Crear usuario + historial
      const result = await executeTransaction('Crear Usuario', async (client) => {
        const insertUserQuery = `
          INSERT INTO usuarios (nombre, email, password_hash, activo)
          VALUES ($1, $2, $3, $4)
          RETURNING id, nombre, email, activo, fecha_creacion, fecha_actualizacion
        `;

        const userResult = await client.query(insertUserQuery, [
          nombre.trim(),
          email.toLowerCase().trim(),
          password_hash,
          activo,
        ]);

        return userResult.rows[0];
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      console.error('[✗] Error al crear usuario:', error.message);

      // Email duplicado
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al crear usuario',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /usuarios/:id
   * Actualiza un usuario existente
   */
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, activo } = req.body;

      // Validar que id sea número
      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El ID debe ser un número positivo',
        });
      }

      // Validar que al menos un campo esté presente
      if (!nombre && !email && activo === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar al menos un campo para actualizar',
          availableFields: ['nombre', 'email', 'activo'],
        });
      }

      // Verificar que el usuario exista
      const checkQuery = 'SELECT id FROM usuarios WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          id: parseInt(id),
        });
      }

      // Construir query de actualización dinámicamente
      let updateQuery = 'UPDATE usuarios SET ';
      const params = [];
      let paramIndex = 1;
      const updatedFields = [];

      if (nombre !== undefined && nombre !== null) {
        if (typeof nombre !== 'string' || nombre.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'El nombre debe ser una cadena no vacía',
          });
        }
        updateQuery += `nombre = $${paramIndex}, `;
        params.push(nombre.trim());
        paramIndex++;
        updatedFields.push('nombre');
      }

      if (email !== undefined && email !== null) {
        if (typeof email !== 'string' || !email.includes('@')) {
          return res.status(400).json({
            success: false,
            error: 'Email inválido',
          });
        }
        updateQuery += `email = $${paramIndex}, `;
        params.push(email.toLowerCase().trim());
        paramIndex++;
        updatedFields.push('email');
      }

      if (activo !== undefined && activo !== null) {
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

      updateQuery += `fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING id, nombre, email, activo, fecha_creacion, fecha_actualizacion`;
      params.push(id);

      const result = await pool.query(updateQuery, params);

      res.json({
        success: true,
        data: result.rows[0],
        updatedFields: updatedFields,
        message: `Usuario actualizado exitosamente (${updatedFields.join(', ')})`,
      });
    } catch (error) {
      console.error('[✗] Error al actualizar usuario:', error.message);

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado por otro usuario',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al actualizar usuario',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /usuarios/:id
   * Elimina un usuario existente
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

      const checkQuery = 'SELECT id, nombre, email FROM usuarios WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          id: parseInt(id),
        });
      }

      const usuarioEliminado = checkResult.rows[0];

      const deleteQuery = 'DELETE FROM usuarios WHERE id = $1';
      await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        deletedUser: {
          id: usuarioEliminado.id,
          nombre: usuarioEliminado.nombre,
          email: usuarioEliminado.email,
        },
      });
    } catch (error) {
      console.error('[✗] Error al eliminar usuario:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = UsuariosController;
