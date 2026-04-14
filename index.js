require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Importar módulos de conexión a base de datos
const { connectDatabase } = require('./config/database');
const { syncDatabase } = require('./config/sequelize');

// Importar Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

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

// Servir uploads como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation - Backend REST',
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: false,
  }
}));

// Importar rutas
const mainRoutes = require('./routes/main');
const statusRoutes = require('./routes/status');
const testRoutes = require('./routes/test');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const uploadRoutes = require('./routes/upload');
const ormRoutes = require('./routes/orm');

// Importar middleware de error
const { errorHandler, multerErrorHandler } = require('./middlewares/validators');

// Usar rutas
app.use('/', mainRoutes);
app.use('/status', statusRoutes);
app.use('/test', testRoutes);
app.use('/auth', authRoutes);  // Rutas de autenticación
app.use('/usuarios', usuariosRoutes);
app.use('/productos', productosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/upload', uploadRoutes);  // Rutas de upload
app.use('/', ormRoutes);  // Las rutas ORM están en /orm/...

// Middleware de error para multer
app.use(multerErrorHandler);

// Middleware de error centralizado
app.use(errorHandler);

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
