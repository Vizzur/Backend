const express = require('express');
const router = express.Router();
const { logAccess } = require('../middlewares/logger');

// Ruta para testing - registra accesos simulados
router.get('/', (req, res) => {
  res.json({
    mensaje: 'Endpoint de testing',
    instrucciones: {
      'GET /test/log-accesos': 'Simula 3 accesos y registra en log.txt'
    }
  });
});

// Simula 3 accesos diferentes para llenar el archivo de log
router.get('/log-accesos', (req, res) => {
  // Simular 3 accesos a diferentes rutas
  logAccess('/', 'GET', '192.168.1.100', 200);
  logAccess('/status', 'GET', '192.168.1.101', 200);
  logAccess('/style-guide.html', 'GET', '192.168.1.102', 200);
  
  res.json({
    mensaje: 'Se han registrado 3 accesos simulados en logs/log.txt',
    accesos: [
      { ruta: '/', metodo: 'GET', ip: '192.168.1.100' },
      { ruta: '/status', metodo: 'GET', ip: '192.168.1.101' },
      { ruta: '/style-guide.html', metodo: 'GET', ip: '192.168.1.102' }
    ]
  });
});

module.exports = router;
