/**
 * Rutas de Uploads
 * 
 * Endpoints para subida, listado y gestión de archivos
 */

const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');
const UploadController = require('../controllers/UploadController');
const { validateId } = require('../middlewares/validators');

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Subir un archivo
 *     description: |
 *       Sube un archivo único a la carpeta uploads/ con organización automática.
 *       
 *       **Tipos permitidos:**
 *       - Imágenes: JPEG, PNG, GIF, WebP
 *       - Documentos: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), TXT, CSV
 *       
 *       **Límites:**
 *       - Tamaño máximo: 10 MB
 *       - El archivo se organiza automáticamente en carpetas (images/, pdfs/, documents/, otros/)
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (imagen, PDF, documento)
 *     responses:
 *       201:
 *         description: Archivo subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Archivo subido exitosamente
 *                 file:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                       example: documento.pdf
 *                     filename:
 *                       type: string
 *                       example: 1712973456789-documento.pdf
 *                       description: Nombre único con timestamp
 *                     path:
 *                       type: string
 *                       example: /uploads/pdfs/1712973456789-documento.pdf
 *                     relativePath:
 *                       type: string
 *                       example: /uploads/pdfs/1712973456789-documento.pdf
 *                       description: URL accesible del archivo
 *                     size:
 *                       type: integer
 *                       example: 204800
 *                       description: Tamaño en bytes
 *                     mimetype:
 *                       type: string
 *                       example: application/pdf
 *       400:
 *         description: Validación fallida o tipo de archivo no permitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Tipo de archivo no permitido
 *       413:
 *         description: Archivo demasiado grande (máx 10 MB)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Archivo demasiado grande
 *                 message:
 *                   type: string
 *                   example: El tamaño máximo permitido es 10 MB
 * /upload/multiple:
 *   post:
 *     summary: Subir múltiples archivos
 *     description: |
 *       Sube hasta 5 archivos simultáneamente.
 *       
 *       **Límites:**
 *       - Máximo 5 archivos por request
 *       - 10 MB máximo por archivo
 *       - Tipos permitidos: imágenes, PDFs, documentos
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array de archivos a subir (máx 5)
 *     responses:
 *       201:
 *         description: Archivos subidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 3 archivo(s) subido(s) exitosamente
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       originalName:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       path:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       mimetype:
 *                         type: string
 *                 totalSize:
 *                   type: integer
 *                   example: 307200
 *                   description: Tamaño total en bytes
 *       400:
 *         description: Error en validación
 *       413:
 *         description: Archivo demasiado grande o demasiados archivos
 * /upload/user/{userId}/photo:
 *   post:
 *     summary: Subir foto de usuario
 *     description: |
 *       Sube una foto de usuario y la asocia automáticamente a su registro en BD.
 *       
 *       **Características:**
 *       - Solo acepta imágenes (JPEG, PNG, GIF, WebP)
 *       - Elimina automáticamente la foto anterior si existe
 *       - Valida que el usuario exista en BD
 *       - Actualiza el campo foto_url en tabla usuarios
 *       - Devuelve la URL accesible de la foto subida
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del usuario propietario de la foto
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (JPEG, PNG, GIF, WebP)
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, image/gif, image/webp
 *     responses:
 *       200:
 *         description: Foto subida y asociada exitosamente a usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Foto de usuario subida y asociada exitosamente
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Pérez
 *                     email:
 *                       type: string
 *                       example: juan@example.com
 *                     foto_url:
 *                       type: string
 *                       example: /uploads/images/1712973456789-avatar.jpg
 *                       description: URL accesible de la foto
 *                 file:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                       example: mi-foto.jpg
 *                     filename:
 *                       type: string
 *                       example: 1712973456789-mi-foto.jpg
 *                     path:
 *                       type: string
 *                       example: /uploads/images/1712973456789-mi-foto.jpg
 *                     size:
 *                       type: integer
 *                       example: 102400
 *                       description: Tamaño en bytes
 *                     mimetype:
 *                       type: string
 *                       example: image/jpeg
 *       400:
 *         description: Validación fallida - Sin archivo, ID inválido o tipo no permitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   enum:
 *                     - No se subió ningún archivo
 *                     - El archivo debe ser una imagen
 *                     - ID de usuario inválido
 *             examples:
 *               sinArchivo:
 *                 value:
 *                   success: false
 *                   error: No se subió ningún archivo
 *               tipoInvalido:
 *                 value:
 *                   success: false
 *                   error: El archivo debe ser una imagen
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Usuario no encontrado
 *       413:
 *         description: Archivo demasiado grande o demasiados archivos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Archivo demasiado grande
 *                 message:
 *                   type: string
 *                   example: El tamaño máximo permitido es 10 MB
 *                 maxSize:
 *                   type: string
 *                   example: 10 MB
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Error al subir foto de usuario
 * /upload/list:
 *   get:
 *     summary: Listar archivos subidos
 *     description: |
 *       Lista todos los archivos subidos con paginación y filtros por tipo.
 *       
 *       **Carpetas disponibles:**
 *       - images: Imágenes (JPEG, PNG, GIF, WebP)
 *       - pdfs: Archivos PDF
 *       - documents: Documentos (Word, Excel, TXT, CSV)
 *       - otros: Otros tipos
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, images, pdfs, documents, otros]
 *           default: all
 *         description: Filtrar por tipo de archivo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Archivos por página (máx 50)
 *     responses:
 *       200:
 *         description: Lista de archivos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: 1712973456789-documento.pdf
 *                       path:
 *                         type: string
 *                         example: /uploads/pdfs/1712973456789-documento.pdf
 *                       size:
 *                         type: integer
 *                         example: 102400
 *                       uploadedAt:
 *                         type: integer
 *                         example: 1712973456789
 *                       type:
 *                         type: string
 *                         example: pdfs
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalRecords:
 *                       type: integer
 *                       example: 42
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                 filters:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *       500:
 *         description: Error al listar archivos
 * /upload/{filename}:
 *   delete:
 *     summary: Eliminar archivo
 *     description: |
 *       Elimina un archivo del servidor.
 *       
 *       **Nota:** Se debe proporcionar solo el nombre del archivo, sin ruta.
 *       Ejemplo: `1712973456789-documento.pdf`
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *           example: 1712973456789-documento.pdf
 *         description: Nombre del archivo a eliminar (sin ruta)
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Archivo eliminado exitosamente
 *                 filename:
 *                   type: string
 *                   example: 1712973456789-documento.pdf
 *       400:
 *         description: Nombre de archivo inválido (contiene ruta relativa)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Nombre de archivo inválido
 *       404:
 *         description: Archivo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Archivo no encontrado
 *       500:
 *         description: Error al eliminar archivo
 */

// POST /upload - Subir un archivo
router.post('/', upload.single('file'), UploadController.uploadFile);

// POST /upload/multiple - Subir múltiples archivos (máximo 5)
router.post('/multiple', upload.array('files', 5), UploadController.uploadMultiple);

// POST /upload/user/:userId/photo - Subir foto de usuario
router.post('/user/:userId/photo', validateId, upload.single('file'), UploadController.uploadUserPhoto);

// GET /upload/list - Listar archivos
router.get('/list', UploadController.listUploads);

// DELETE /upload/:filename - Eliminar archivo
router.delete('/:filename', UploadController.deleteUpload);

module.exports = router;
