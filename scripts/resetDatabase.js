/**
 * Script para resetear la base de datos
 * Ejecutar: node scripts/resetDatabase.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('[*] Reseteando base de datos...');

    // Eliminar tablas en orden (historial primero por FK)
    const dropHistorialQuery = 'DROP TABLE IF EXISTS historial_usuarios CASCADE';
    await pool.query(dropHistorialQuery);
    console.log('[✓] Tabla "historial_usuarios" eliminada');

    const dropQuery = 'DROP TABLE IF EXISTS usuarios CASCADE';
    await pool.query(dropQuery);
    console.log('[✓] Tabla "usuarios" eliminada');

    // Crear tabla usuarios
    const createTableQuery = `
      CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT true
      );
    `;

    await pool.query(createTableQuery);
    console.log('[✓] Tabla "usuarios" creada');

    // Crear tabla historial_usuarios
    const createHistorialQuery = `
      CREATE TABLE historial_usuarios (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        accion VARCHAR(50) NOT NULL,
        descripcion TEXT,
        detalles_anteriores JSONB,
        detalles_nuevos JSONB,
        fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_origen VARCHAR(45),
        usuario_responsable VARCHAR(100)
      );
    `;

    await pool.query(createHistorialQuery);
    console.log('[✓] Tabla "historial_usuarios" creada');

    // Crear índices para mejor rendimiento
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
      CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_creacion ON usuarios(fecha_creacion DESC);
      CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_usuarios(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_historial_accion ON historial_usuarios(accion);
      CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_usuarios(fecha_evento DESC);
    `;

    await pool.query(createIndexQuery);
    console.log('[✓] Índices creados');

    console.log('[✓] Base de datos reseteada exitosamente');
    pool.end();

  } catch (error) {
    console.error('[✗] Error al resetear la base de datos:', error.message);
    pool.end();
    process.exit(1);
  }
}

// Ejecutar reset
resetDatabase();
