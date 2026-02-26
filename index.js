require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Importar módulos de conexión a base de datos
const { connectDatabase } = require('./config/database');
const { syncDatabase } = require('./config/sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

// Importar módulo de logging
const { loggerMiddleware, logAccess } = require('./middlewares/logger');

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para registrar acceso a rutas
app.use(loggerMiddleware);

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
const mainRoutes = require('./routes/main');
const statusRoutes = require('./routes/status');
const testRoutes = require('./routes/test');
const usuariosRoutes = require('./routes/usuarios');
const ormRoutes = require('./routes/orm');
const pedidosRoutes = require('./routes/pedidos');

// Usar rutas
app.use('/', mainRoutes);
app.use('/status', statusRoutes);
app.use('/test', testRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/', ormRoutes);  // Las rutas ORM están en /orm/...
app.use('/', pedidosRoutes);  // Las rutas de pedidos están en /orm/pedidos


// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`[✓] Servidor ejecutándose en http://localhost:${PORT}`);
  
  // Conectar a la base de datos con cliente pg
  try {
    await connectDatabase();
    console.log('[✓] Cliente pg conectado');
  } catch (error) {
    console.error('[✗] No se pudo conectar BD con pg');
  }
  
  // Sincronizar Sequelize ORM
  try {
    await syncDatabase(false);  // false = no forzar recreación de tablas
    console.log('[✓] Sequelize ORM sincronizado');
  } catch (error) {
    console.error('[✗] No se pudo sincronizar Sequelize');
  }
  
  console.log('[✓] Sistema listo para usar');
});
