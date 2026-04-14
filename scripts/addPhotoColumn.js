/**
 * Script para agregar columna foto_url a tabla usuarios
 * 
 * Ejecutar con: node scripts/addPhotoColumn.js
 */

const { pool } = require('../config/database');

async function addPhotoColumn() {
  const client = await pool.connect();
  
  try {
    // Verificar si la columna ya existe
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'foto_url'
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('[✓] La columna foto_url ya existe en la tabla usuarios');
      return;
    }
    
    // Agregar la columna
    const alterQuery = `
      ALTER TABLE usuarios 
      ADD COLUMN foto_url VARCHAR(500)
    `;
    
    await client.query(alterQuery);
    console.log('[✓] Columna foto_url agregada exitosamente a tabla usuarios');
    
  } catch (error) {
    console.error('[✗] Error al agregar columna:', error.message);
  } finally {
    client.release();
  }
}

// Ejecutar
addPhotoColumn().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('[✗] Error fatal:', error);
  process.exit(1);
});
