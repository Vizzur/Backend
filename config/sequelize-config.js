/**
 * Configuración de Sequelize para PostgreSQL
 * 
 * Sequelize se conecta a la misma BD que el cliente pg
 * pero proporciona ORM, validaciones, migraciones automáticas
 */

require('dotenv').config();

module.exports = {
  // Conexión a PostgreSQL
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'usuarios_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  
  // Opciones de Sequelize
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  
  // Timestamps automáticos
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion',
  
  // Pool de conexiones
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // Logging (desactiva para ver menos output)
  logging: false  // Cambiar a console.log para ver SQL generado
};
