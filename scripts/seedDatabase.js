/**
 * Script para inicializar datos simulados en la tabla usuarios
 * Ejecutar: node scripts/seedDatabase.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    console.log('[*] Iniciando seeding de datos...');

    // Datos simulados de usuarios
    const usuariosSeed = [
      {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password_hash: '$2b$10$hash_ejemplo_juan_123456789', // Hash bcrypt placeholder
      },
      {
        nombre: 'María García',
        email: 'maria@example.com',
        password_hash: '$2b$10$hash_ejemplo_maria_123456789',
      },
      {
        nombre: 'Carlos López',
        email: 'carlos@example.com',
        password_hash: '$2b$10$hash_ejemplo_carlos_123456789',
      },
      {
        nombre: 'Ana Martínez',
        email: 'ana@example.com',
        password_hash: '$2b$10$hash_ejemplo_ana_123456789',
      },
      {
        nombre: 'Roberto Sánchez',
        email: 'roberto@example.com',
        password_hash: '$2b$10$hash_ejemplo_roberto_123456789',
      },
    ];

    // Verificar si la tabla tiene datos
    const checkQuery = 'SELECT COUNT(*) as count FROM usuarios';
    const checkResult = await pool.query(checkQuery);
    const userCount = parseInt(checkResult.rows[0].count);

    if (userCount > 0) {
      console.log(`[!] La tabla usuarios ya contiene ${userCount} registros. Saltando seeding.`);
      console.log('[*] Para reiniciar la BD, ejecuta: npm run reset:db');
      pool.end();
      return;
    }

    // Insertar datos
    let insertados = 0;
    for (const usuario of usuariosSeed) {
      const insertQuery = `
        INSERT INTO usuarios (nombre, email, password_hash, activo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        usuario.nombre,
        usuario.email,
        usuario.password_hash,
        true,
      ]);

      if (result.rows.length > 0) {
        insertados++;
        const usuarioId = result.rows[0].id;
        console.log(`[✓] Usuario "${usuario.nombre}" insertado (ID: ${usuarioId})`);

        // Agregar entrada en historial
        const historialQuery = `
          INSERT INTO historial_usuarios (usuario_id, accion, descripcion, detalles_nuevos, usuario_responsable)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await pool.query(historialQuery, [
          usuarioId,
          'REGISTRO',
          `Registro inicial del usuario ${usuario.nombre}`,
          JSON.stringify({
            nombre: usuario.nombre,
            email: usuario.email,
            activo: true,
          }),
          'SISTEMA',
        ]);

        console.log(`  └─ Historial creado para "${usuario.nombre}"`);
      }
    }

    console.log(`\n[✓] Seeding completado: ${insertados} usuarios insertados`);
    pool.end();

  } catch (error) {
    console.error('[✗] Error durante el seeding:', error.message);
    pool.end();
    process.exit(1);
  }
}

// Ejecutar seeding
seedDatabase();
