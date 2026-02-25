const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Crear pool de conexiones a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Archivo para logging de transacciones fallidas
const TRANSACTION_LOG_FILE = path.join(__dirname, '../logs/transaction-errors.log');

// Asegurar que existe el directorio logs
const logsDir = path.dirname(TRANSACTION_LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Evento de conexión exitosa
pool.on('connect', () => {
  console.log('[✓] Conectado a PostgreSQL exitosamente');
});

// Evento de error en la conexión
pool.on('error', (err) => {
  console.error('[✗] Error inesperado en el pool de conexiones:', err);
  process.exit(-1);
});

// Función para registrar errores de transacción en archivo
function logTransactionError(descripcion, detalles) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${descripcion}\nDetalles: ${JSON.stringify(detalles, null, 2)}\n${'='.repeat(80)}\n`;

  try {
    fs.appendFileSync(TRANSACTION_LOG_FILE, logEntry);
  } catch (err) {
    console.error('[✗] Error al escribir en log de transacciones:', err.message);
  }
}

// Función para ejecutar operaciones en transacción
async function executeTransaction(transactionName, operations) {
  const client = await pool.connect();

  try {
    console.log(`\n[*] Iniciando transacción: ${transactionName}`);

    // Iniciar transacción
    await client.query('BEGIN');
    console.log('[*] BEGIN - Transacción iniciada');

    // Ejecutar operaciones pasadas como callback
    const result = await operations(client);

    // Commit si todo fue exitoso
    await client.query('COMMIT');
    console.log('[✓] COMMIT - Transacción confirmada exitosamente\n');

    return {
      success: true,
      data: result,
      message: `${transactionName} completada exitosamente`,
    };

  } catch (error) {
    // Rollback en caso de error
    try {
      await client.query('ROLLBACK');
      console.log('[⚠️] ROLLBACK - Transacción revertida por error');
      console.log(`[✗] Error: ${error.message}\n`);

      // Registrar error en archivo
      logTransactionError(`Transacción fallida: ${transactionName}`, {
        nombre: transactionName,
        error: error.message,
        codigo: error.code,
        timestamp: new Date().toISOString(),
      });

    } catch (rollbackError) {
      console.error('[✗] Error crítico durante rollback:', rollbackError.message);
    }

    return {
      success: false,
      error: error.message,
      message: `${transactionName} falló y fue revertida`,
    };

  } finally {
    client.release();
  }
}

// Función para inicializar la base de datos y crear tabla de usuarios
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
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
    console.log('[✓] Tabla "usuarios" verificada/creada exitosamente');
  } catch (error) {
    console.error('[✗] Error al inicializar la base de datos:', error.message);
    throw error;
  }
}

// Función para conectar a la base de datos
async function connectDatabase() {
  try {
    const client = await pool.connect();
    console.log('[✓] Test de conexión exitoso a PostgreSQL');
    client.release();
    await initializeDatabase();
  } catch (error) {
    console.error('[✗] Error al conectar a PostgreSQL:', error.message);
    console.error('Asegúrate de que:');
    console.error('  1. PostgreSQL esté corriendo');
    console.error('  2. Las credenciales en .env sean correctas');
    console.error('  3. La base de datos exista');
    throw error;
  }
}

module.exports = {
  pool,
  connectDatabase,
  initializeDatabase,
  executeTransaction,
  logTransactionError,
};
