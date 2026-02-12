const express = require('express');
const router = express.Router();

// Ruta GET para el estado del servidor
router.get('/', (req, res) => {
  const uptime = process.uptime();
  const statusData = {
    estado: 'en línea',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)} segundos`,
    memoria: {
      usado: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
    },
    version: process.version
  };
  res.json(statusData);
});

module.exports = router;
