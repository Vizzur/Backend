/**
 * Controlador de Uploads
 * 
 * Maneja la lógica de subida de archivos
 */

const path = require('path');
const fs = require('fs');
const { pool, executeTransaction } = require('../config/database');
const { db } = require('../config/sequelize');

class UploadController {
  /**
   * Subir un archivo único
   */
  static async uploadFile(req, res, next) {
    try {
      // Verificar si se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se subió ningún archivo'
        });
      }

      const file = req.file;
      
      // Información del archivo
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        relativePath: `/uploads/${path.relative(path.join(__dirname, '../uploads'), file.path).replace(/\\/g, '/')}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Archivo subido exitosamente',
        file: fileInfo
      });

    } catch (error) {
      console.error('[✗] Error en uploadFile:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir archivo'
      });
    }
  }

  /**
   * Subir múltiples archivos
   */
  static async uploadMultiple(req, res, next) {
    try {
      // Verificar si se subieron archivos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se subieron archivos'
        });
      }

      const files = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        relativePath: `/uploads/${path.relative(path.join(__dirname, '../uploads'), file.path).replace(/\\/g, '/')}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      }));

      res.status(201).json({
        success: true,
        message: `${files.length} archivo(s) subido(s) exitosamente`,
        files,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

    } catch (error) {
      console.error('[✗] Error en uploadMultiple:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir archivos'
      });
    }
  }

  /**
   * Subir foto de usuario
   * 
   * Asocia la foto a un usuario específico en BD
   */
  static async uploadUserPhoto(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Validar ID del usuario
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum) || userIdNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
      }

      // Verificar que se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se subió ningún archivo'
        });
      }

      // Verificar que es imagen
      if (!req.file.mimetype.startsWith('image/')) {
        // Eliminar archivo si no es imagen
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'El archivo debe ser una imagen'
        });
      }

      // Verificar que el usuario existe
      const userExists = await db.User.findByPk(userIdNum);
      if (!userExists) {
        // Eliminar archivo si usuario no existe
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Construir ruta relativa de la foto
      const photoPath = `/uploads/${path.relative(path.join(__dirname, '../uploads'), req.file.path).replace(/\\/g, '/')}`;

      // Eliminar foto anterior si existe
      try {
        const userResult = await pool.query(
          'SELECT foto_url FROM usuarios WHERE id = $1',
          [userIdNum]
        );
        
        if (userResult.rows[0] && userResult.rows[0].foto_url) {
          const oldPhotoPath = path.join(__dirname, '..', 'public', userResult.rows[0].foto_url);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      } catch (error) {
        console.warn('[!] No se pudo eliminar foto anterior:', error.message);
      }

      // Actualizar foto en BD
      const updateResult = await pool.query(
        'UPDATE usuarios SET foto_url = $1 WHERE id = $2 RETURNING id, nombre, email, foto_url',
        [photoPath, userIdNum]
      );

      if (updateResult.rows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Error al actualizar usuario'
        });
      }

      const usuario = updateResult.rows[0];

      res.status(200).json({
        success: true,
        message: 'Foto de usuario subida y asociada exitosamente',
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          foto_url: usuario.foto_url
        },
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: photoPath,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('[✗] Error en uploadUserPhoto:', error);
      
      // Limpiar archivo en caso de error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.warn('[!] No se pudo limpiar archivo:', e.message);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Error al subir foto de usuario'
      });
    }
  }

  /**
   * Listar archivos subidos
   */
  static async listUploads(req, res, next) {
    try {
      const { type = 'all', page = 1, limit = 10 } = req.query;
      
      const uploadsDir = require('../config/upload').uploadsDir;
      
      let searchPath = uploadsDir;
      if (type !== 'all' && ['images', 'pdfs', 'documents', 'otros'].includes(type)) {
        searchPath = path.join(uploadsDir, type);
      }

      // Leer archivos recursivamente
      const getAllFiles = (dir, prefix = '') => {
        let files = [];
        
        if (!fs.existsSync(dir)) return files;
        
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile()) {
            const relativePath = `/uploads/${path.relative(uploadsDir, fullPath).replace(/\\/g, '/')}`;
            files.push({
              name: item,
              path: relativePath,
              size: stat.size,
              uploadedAt: stat.birthtimeMs,
              type: type === 'all' ? path.dirname(relativePath).split('/').pop() : type
            });
          } else if (stat.isDirectory()) {
            files = [...files, ...getAllFiles(fullPath, prefix)];
          }
        });
        
        return files;
      };

      let allFiles = getAllFiles(searchPath);
      
      // Ordenar por fecha descendente
      allFiles.sort((a, b) => b.uploadedAt - a.uploadedAt);

      // Paginación
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const offset = (pageNum - 1) * limitNum;
      const totalPages = Math.ceil(allFiles.length / limitNum);

      const paginatedFiles = allFiles.slice(offset, offset + limitNum);

      res.json({
        success: true,
        data: paginatedFiles,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalRecords: allFiles.length,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        },
        filters: {
          type: type === 'all' ? 'Todos' : type
        }
      });

    } catch (error) {
      console.error('[✗] Error en listUploads:', error);
      res.status(500).json({
        success: false,
        error: 'Error al listar uploads'
      });
    }
  }

  /**
   * Eliminar archivo
   */
  static async deleteUpload(req, res, next) {
    try {
      const { filename } = req.params;
      
      // Validar que el filename no contenga rutas relativas
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de archivo inválido'
        });
      }

      const uploadsDir = require('../config/upload').uploadsDir;
      
      // Buscar archivo recursivamente
      const findFile = (dir) => {
        if (!fs.existsSync(dir)) return null;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile() && item === filename) {
            return fullPath;
          } else if (stat.isDirectory()) {
            const found = findFile(fullPath);
            if (found) return found;
          }
        }
        return null;
      };

      const filePath = findFile(uploadsDir);
      
      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado'
        });
      }

      // Eliminar archivo
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente',
        filename
      });

    } catch (error) {
      console.error('[✗] Error en deleteUpload:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar archivo'
      });
    }
  }
}

module.exports = UploadController;
