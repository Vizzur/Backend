/**
 * Configuración de Multer para subida de archivos
 * 
 * Define dónde guardar archivos, nombrado de archivo, tipos permitidos, etc.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio base para uploads
const uploadsDir = path.join(__dirname, '../uploads');

// Asegurar que existe el directorio
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configurar almacenamiento de archivos
 * 
 * destination: Dónde guardar los archivos
 * filename: Cómo nombrar los archivos (timestamp + nombre original)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usar un subdirectorio basado en tipo de archivo
    let uploadPath = uploadsDir;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadsDir, 'images');
    } else if (file.mimetype.startsWith('application/pdf')) {
      uploadPath = path.join(uploadsDir, 'pdfs');
    } else if (file.mimetype.startsWith('application/')) {
      uploadPath = path.join(uploadsDir, 'documents');
    } else {
      uploadPath = path.join(uploadsDir, 'otros');
    }
    
    // Crear carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + hash + nombre original
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Nombre: timestamp-nombre-limpio.ext
    const filename = `${timestamp}-${name.replace(/\s+/g, '-').toLowerCase()}${ext}`;
    
    cb(null, filename);
  }
});

/**
 * Filtrar tipos de archivo permitidos
 * 
 * @param {Object} req - Request Object
 * @param {Object} file - Objeto del archivo
 * @param {Function} cb - Callback
 */
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

/**
 * Configuración de límites
 */
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB máximo
  files: 5 // Máximo 5 archivos por request
};

/**
 * Crear instancia de multer con configuración
 */
const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = {
  upload,
  uploadsDir,
  allowedMimes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};
