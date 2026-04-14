/**
 * Middlewares de Validación
 * 
 * Valida los inputs de las requests antes de pasarlas a los controladores.
 */

/**
 * Valida que un usuario tenga los campos requeridos
 */
const validateUsuario = (req, res, next) => {
  const { nombre, email, password_hash } = req.body;

  // Validar campos requeridos
  if (!nombre || !email || !password_hash) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      missingFields: [
        !nombre && 'nombre',
        !email && 'email',
        !password_hash && 'password_hash'
      ].filter(Boolean)
    });
  }

  // Validar tipos de datos
  if (typeof nombre !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'nombre',
      message: 'El nombre debe ser una cadena de texto'
    });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'email',
      message: 'El email no tiene un formato válido'
    });
  }

  if (typeof password_hash !== 'string' || password_hash.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'password_hash',
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  // Validar longitud
  if (nombre.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'nombre',
      message: 'El nombre no puede estar vacío'
    });
  }

  if (nombre.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'nombre',
      message: 'El nombre no puede exceder 100 caracteres'
    });
  }

  if (email.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'email',
      message: 'El email no puede exceder 100 caracteres'
    });
  }

  next();
};

/**
 * Valida que un producto tenga los campos requeridos (para creación)
 */
const validateProducto = (req, res, next) => {
  const { nombre, precio } = req.body;

  // Validar campos requeridos
  if (!nombre || precio === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      missingFields: [
        !nombre && 'nombre',
        price === undefined && 'precio'
      ].filter(Boolean)
    });
  }

  // Validar tipos
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'nombre',
      message: 'El nombre debe ser una cadena no vacía'
    });
  }

  const precioNum = parseFloat(precio);
  if (isNaN(precioNum) || precioNum < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'precio',
      message: 'El precio debe ser un número positivo'
    });
  }

  if (nombre.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'nombre',
      message: 'El nombre no puede exceder 100 caracteres'
    });
  }

  next();
};

/**
 * Valida que un pedido tenga los campos requeridos (para creación)
 */
const validatePedido = (req, res, next) => {
  const { usuario_id, numero_pedido, monto_total } = req.body;

  // Validar campos requeridos
  if (!usuario_id || !numero_pedido || monto_total === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      missingFields: [
        !usuario_id && 'usuario_id',
        !numero_pedido && 'numero_pedido',
        monto_total === undefined && 'monto_total'
      ].filter(Boolean)
    });
  }

  // Validar tipos
  if (!Number.isInteger(Number(usuario_id)) || Number(usuario_id) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'usuario_id',
      message: 'El usuario_id debe ser un número positivo'
    });
  }

  if (typeof numero_pedido !== 'string' || numero_pedido.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'numero_pedido',
      message: 'El número de pedido debe ser una cadena no vacía'
    });
  }

  const montoNum = parseFloat(monto_total);
  if (isNaN(montoNum) || montoNum < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'monto_total',
      message: 'El monto total debe ser un número positivo'
    });
  }

  if (numero_pedido.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'numero_pedido',
      message: 'El número de pedido no puede exceder 50 caracteres'
    });
  }

  next();
};

/**
 * Valida que el ID sea un número positivo
 */
const validateId = (req, res, next) => {
  const { id, userId } = req.params;
  const paramId = id || userId;

  if (!Number.isInteger(Number(paramId)) || Number(paramId) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      field: 'id',
      message: 'El ID debe ser un número positivo'
    });
  }

  next();
};

/**
 * Valida parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        field: 'page',
        message: 'La página debe ser un número mayor a 0'
      });
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        field: 'limit',
        message: 'El límite debe estar entre 1 y 100'
      });
    }
  }

  next();
};

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  console.error('[✗] Error no capturado:', err);

  // Errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validación fallida',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Errores de restricción única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Conflicto',
      message: 'El registro ya existe',
      field: err.errors[0]?.path
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * Middleware para manejar errores de Multer
 */
const multerErrorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Archivo demasiado grande',
      message: 'El tamaño máximo permitido es 10 MB',
      maxSize: '10 MB',
      receivedSize: err.limit
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'Demasiados archivos',
      message: 'El máximo permitido es 5 archivos',
      maxFiles: 5
    });
  }

  if (err.code === 'LIMIT_PART_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Demasiados campos',
      message: 'El número de campos excedió el límite'
    });
  }

  if (err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({
      success: false,
      error: 'Tipo de archivo no permitido',
      message: err.message,
      receivedType: err.message
    });
  }

  // Error de multer genérico
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: 'Error al subir archivo',
      message: err.message
    });
  }

  // Dejar pasar otros errores al siguiente middleware
  next(err);
};

module.exports = {
  validateUsuario,
  validateProducto,
  validatePedido,
  validateId,
  validatePagination,
  errorHandler,
  multerErrorHandler
};
