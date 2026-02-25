const express = require('express');
const { pool, executeTransaction } = require('../config/database');

const router = express.Router();

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
router.get('/', async (req, res) => {
  try {
    // Parámetros de filtrado
    const { nombre, email, activo, page = 1, limit = 10 } = req.query;

    // Convertir a números para paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 registros

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

    // Respuesta exitosa
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
    console.error('[✗] Error al consultar usuarios:', error.message);

    // Respuesta de error
    res.status(500).json({
      success: false,
      error: 'Error al consultar la base de datos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      message: 'No fue posible obtener los usuarios en este momento',
    });
  }
});

/**
 * GET /usuarios/:id
 * Obtiene un usuario específico por ID
 */
router.get('/:id', async (req, res) => {
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
    console.error('[✗] Error al consultar usuario por ID:', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al consultar la base de datos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * PUT /usuarios/:id
 * Actualiza un usuario existente
 * 
 * Body:
 *  - nombre: (opcional) Nuevo nombre
 *  - email: (opcional) Nuevo email (debe ser único)
 *  - activo: (opcional) true/false
 * 
 * Campos protegidos (NO se pueden actualizar):
 *  - id, password_hash, fecha_creacion, fecha_actualizacion
 */
router.put('/:id', async (req, res) => {
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

    // VALIDACIÓN PREVIA: Verificar que el usuario exista
    const checkQuery = 'SELECT id FROM usuarios WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        id: parseInt(id),
      });
    }

    // Construir consulta de actualización dinámicamente
    let updateQuery = 'UPDATE usuarios SET ';
    const params = [];
    let paramIndex = 1;
    const updatedFields = [];

    // Actualizar nombre
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

    // Actualizar email
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

    // Actualizar estado activo
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

    // Agregar timestamp de actualización
    updateQuery += `fecha_actualizacion = CURRENT_TIMESTAMP `;
    updatedFields.push('fecha_actualizacion');

    // Completar la query
    updateQuery += `WHERE id = $${paramIndex} RETURNING id, nombre, email, activo, fecha_creacion, fecha_actualizacion`;
    params.push(id);

    // Ejecutar actualización
    const result = await pool.query(updateQuery, params);

    res.json({
      success: true,
      data: result.rows[0],
      updatedFields: updatedFields,
      message: `Usuario actualizado exitosamente (${updatedFields.join(', ')})`,
    });

  } catch (error) {
    console.error('[✗] Error al actualizar usuario:', error.message);

    // Detectar si es error de email duplicado (constraint violation)
    if (error.code === '23505') { // Código de unique constraint violation en PostgreSQL
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado por otro usuario',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar el usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * DELETE /usuarios/:id
 * Elimina un usuario existente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que id sea número
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo',
      });
    }

    // VALIDACIÓN PREVIA: Verificar que el usuario existe ANTES de deletear
    const checkQuery = 'SELECT id, nombre, email FROM usuarios WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado. No se puede eliminar un usuario que no existe.',
        id: parseInt(id),
      });
    }

    // Guardar datos del usuario a eliminar (para respuesta)
    const usuarioEliminado = checkResult.rows[0];

    // Proceder a eliminar
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
      error: 'Error al eliminar el usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /usuarios
 * Crea un nuevo usuario con entrada en historial (transacción)
 * 
 * Body:
 *  - nombre: (requerido) Nombre del usuario
 *  - email: (requerido) Email único
 *  - password_hash: (requerido) Hash de contraseña
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, email, password_hash, forceError } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Los campos nombre, email y password_hash son requeridos',
      });
    }

    if (typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre debe ser una cadena no vacía',
      });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
    }

    // Ejecutar transacción: Crear usuario + historial
    const result = await executeTransaction('Crear Usuario + Historial', async (client) => {
      // 1. Insertar usuario
      const insertUserQuery = `
        INSERT INTO usuarios (nombre, email, password_hash, activo)
        VALUES ($1, $2, $3, true)
        RETURNING id, nombre, email, activo, fecha_creacion, fecha_actualizacion
      `;

      const userResult = await client.query(insertUserQuery, [
        nombre.trim(),
        email.toLowerCase().trim(),
        password_hash,
      ]);

      const nuevoUsuario = userResult.rows[0];

      console.log(`[*] Paso 1: Usuario creado (ID: ${nuevoUsuario.id})`);

      // 2. Simulación de error forzado (para pruebas)
      if (forceError && forceError === 'email_duplicate') {
        // Intentar insertar un email que ya existe
        throw new Error('Simulated error: Email ya existe en historial');
      }

      // 3. Insertar entrada en historial
      const insertHistorialQuery = `
        INSERT INTO historial_usuarios (usuario_id, accion, descripcion, detalles_nuevos, usuario_responsable)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const historialResult = await client.query(insertHistorialQuery, [
        nuevoUsuario.id,
        'REGISTRO',
        `Registro inicial del usuario ${nombre}`,
        JSON.stringify({
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          activo: nuevoUsuario.activo,
        }),
        'API',
      ]);

      console.log(`[*] Paso 2: Entrada de historial creada (ID: ${historialResult.rows[0].id})`);

      // 4. Simulación de error forzado (después del historial)
      if (forceError && forceError === 'after_history') {
        throw new Error('Simulated error: Error después de crear historial');
      }

      return {
        usuario: nuevoUsuario,
        historialId: historialResult.rows[0].id,
      };
    });

    // Responder al cliente
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data.usuario,
        historialId: result.data.historialId,
        message: result.message,
        detalles: {
          pasos: [
            '1. Usuario insertado en tabla usuarios',
            '2. Entrada de audit insertada en historial_usuarios',
            '3. Transacción confirmada (COMMIT)',
          ],
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message,
        detalles: {
          rollback: 'Todas las operaciones fueron revertidas',
          pasos: [
            '1. Usuario NOT insertado',
            '2. Historial NOT insertado',
            '3. Transacción revertida (ROLLBACK)',
          ],
        },
      });
    }

  } catch (error) {
    console.error('[✗] Error inesperado en POST /usuarios:', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al crear usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /usuarios/historial/:id
 * Obtiene el historial de cambios de un usuario
 */
router.get('/historial/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Validar que sea número
    if (!Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El ID debe ser un número positivo',
      });
    }

    // Verificar que el usuario existe
    const checkQuery = 'SELECT id FROM usuarios WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [usuarioId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        id: parseInt(usuarioId),
      });
    }

    // Obtener historial
    const historialQuery = `
      SELECT id, usuario_id, accion, descripcion, detalles_anteriores, detalles_nuevos, fecha_evento, usuario_responsable
      FROM historial_usuarios
      WHERE usuario_id = $1
      ORDER BY fecha_evento DESC
    `;

    const historialResult = await pool.query(historialQuery, [usuarioId]);

    res.json({
      success: true,
      data: historialResult.rows,
      total: historialResult.rows.length,
      message: `${historialResult.rows.length} entrada(s) de historial encontrada(s)`,
    });

  } catch (error) {
    console.error('[✗] Error al obtener historial:', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al consultar el historial',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
