#!/usr/bin/env node

/**
 * Script para insertar datos de ejemplo de pedidos
 * 
 * Crea 3-5 pedidos por usuario para demostrar relaciones Sequelize
 */

require('dotenv').config();
const { db, syncDatabase, disconnectDatabase } = require('../config/sequelize');

// Datos de ejemplo para pedidos
const pedidosEjemplo = [
  // Pedidos del usuario 1 (Juan Pérez)
  {
    usuario_id: 1,
    numero_pedido: 'PED-001-2026',
    descripcion: 'Laptop Dell XPS 15',
    monto_total: 1299.99,
    estado: 'ENTREGADO'
  },
  {
    usuario_id: 1,
    numero_pedido: 'PED-002-2026',
    descripcion: 'Monitor 4K LG 27"',
    monto_total: 499.99,
    estado: 'ENVIADO'
  },
  {
    usuario_id: 1,
    numero_pedido: 'PED-003-2026',
    descripcion: 'Teclado mecánico RGB',
    monto_total: 159.99,
    estado: 'CONFIRMADO'
  },
  
  // Pedidos del usuario 2 (María García)
  {
    usuario_id: 2,
    numero_pedido: 'PED-004-2026',
    descripcion: 'Auriculares Sony WH-1000XM5',
    monto_total: 399.99,
    estado: 'ENTREGADO'
  },
  {
    usuario_id: 2,
    numero_pedido: 'PED-005-2026',
    descripcion: 'Webcam Logitech 4K',
    monto_total: 199.99,
    estado: 'PENDIENTE'
  },
  
  // Pedidos del usuario 3 (Carlos López)
  {
    usuario_id: 3,
    numero_pedido: 'PED-006-2026',
    descripcion: 'SSD Samsung 1TB',
    monto_total: 129.99,
    estado: 'ENTREGADO'
  },
  {
    usuario_id: 3,
    numero_pedido: 'PED-007-2026',
    descripcion: 'Memoria RAM 32GB DDR4',
    monto_total: 89.99,
    estado: 'ENVIADO'
  },
  {
    usuario_id: 3,
    numero_pedido: 'PED-008-2026',
    descripcion: 'Fuente de poder 850W 80+Gold',
    monto_total: 179.99,
    estado: 'CONFIRMADO'
  },
  
  // Pedidos del usuario 4 (Ana Martínez)
  {
    usuario_id: 4,
    numero_pedido: 'PED-009-2026',
    descripcion: 'Monitor OLED 32" Asus',
    monto_total: 799.99,
    estado: 'PENDIENTE'
  },
  {
    usuario_id: 4,
    numero_pedido: 'PED-010-2026',
    descripcion: 'MousePad XXL RGB',
    monto_total: 49.99,
    estado: 'ENTREGADO'
  },
  
  // Pedidos del usuario 5 (Roberto Sánchez)
  {
    usuario_id: 5,
    numero_pedido: 'PED-011-2026',
    descripcion: 'Tarjeta gráfica RTX 4090',
    monto_total: 1999.99,
    estado: 'CANCELADO'
  },
  {
    usuario_id: 5,
    numero_pedido: 'PED-012-2026',
    descripcion: 'Procesador Intel i9-14900K',
    monto_total: 589.99,
    estado: 'ENTREGADO'
  }
];

/**
 * Insertar pedidos de ejemplo
 */
async function seedPedidos() {
  try {
    console.log('[⏳] Inicializando Sequelize...');
    await syncDatabase(false);
    
    console.log('[⏳] Insertando pedidos de ejemplo...');
    
    let insertados = 0;
    for (const pedido of pedidosEjemplo) {
      try {
        await db.Order.create(pedido);
        insertados++;
        console.log(`   ✓ Pedido ${pedido.numero_pedido} creado`);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`   ⚠ Pedido ${pedido.numero_pedido} ya existe, omitido`);
        } else {
          console.error(`   ✗ Error creando ${pedido.numero_pedido}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n[✅] Se insertaron ${insertados} pedidos exitosamente`);
    
    // Mostrar resumen
    console.log('\n[📊] Resumen de datos:');
    for (let usuarioId = 1; usuarioId <= 5; usuarioId++) {
      const pedidos = await db.Order.findAll({
        where: { usuario_id: usuarioId }
      });
      const usuario = await db.User.findByPk(usuarioId);
      if (usuario) {
        console.log(`   ${usuario.nombre}: ${pedidos.length} pedido(s)`);
      }
    }
    
  } catch (error) {
    console.error('[✗] Error:', error);
  } finally {
    await disconnectDatabase();
  }
}

// Ejecutar seeding
seedPedidos();
