const express = require('express');
const router = express.Router();

// Ruta GET para la página principal
router.get('/', (req, res) => {
  const data = {
    titulo: 'Bienvenido al Servidor',
    mensaje: 'Esta es la página principal del servidor',
    timestamp: new Date().toLocaleString('es-ES')
  };
  res.render('index', data);
});

module.exports = router;
