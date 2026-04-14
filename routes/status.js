const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Verificar estado de la API
 *     description: Retorna información del estado y salud del servidor
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   example: "en línea"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 uptime:
 *                   type: string
 *                   example: "3600 segundos"
 *                 memoria:
 *                   type: object
 *                   properties:
 *                     usado:
 *                       type: string
 *                       example: "50 MB"
 *                     total:
 *                       type: string
 *                       example: "256 MB"
 *                 version:
 *                   type: string
 *                   example: "v18.0.0"
 */

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
