/**
 * Inicialización de Sequelize ORM
 * 
 * Proporciona instancia global de Sequelize con todos los modelos
 * cargados y sincronizados con la BD
 */

const { Sequelize } = require('sequelize');
const config = require('./sequelize-config');

// Crear instancia de Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    timestamps: config.timestamps,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    pool: config.pool,
    logging: config.logging
  }
);

// Importar modelos
const User = require('../models/User')(sequelize);
const Order = require('../models/Order')(sequelize);

/**
 * DEFINIR RELACIONES ENTRE MODELOS
 * 
 * Un Usuario puede tener muchos Pedidos (1:N)
 * Un Pedido pertenece a un Usuario (N:1)
 */
User.hasMany(Order, {
  foreignKey: 'usuario_id',
  as: 'pedidos',  // Alias para acceder a los pedidos
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Order.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'usuario'  // Alias para acceder al usuario
});

// Objeto que contiene la instancia y todos los modelos
const db = {
  sequelize,
  User,
  Order
};

/**
 * Sincronizar modelos con la BD
 * 
 * @param {boolean} force - Si true, crea tablas desde cero
 * @returns {Promise}
 */
async function syncDatabase(force = false) {
  try {
    await sequelize.authenticate();
    console.log('[✓] Conexión Sequelize a PostgreSQL exitosa');
    
    // Sincronizar todos los modelos
    await sequelize.sync({ force });
    console.log('[✓] Modelos sincronizados con la base de datos');
    
    return true;
  } catch (error) {
    console.error('[✗] Error sincronizando Sequelize:', error);
    return false;
  }
}

/**
 * Desconectar de la BD
 */
async function disconnectDatabase() {
  try {
    await sequelize.close();
    console.log('[✓] Desconectado de PostgreSQL');
  } catch (error) {
    console.error('[✗] Error al desconectar:', error);
  }
}

module.exports = {
  sequelize,
  db,
  syncDatabase,
  disconnectDatabase
};
