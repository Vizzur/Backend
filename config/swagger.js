/**
 * Configuración de Swagger/OpenAPI para documentación de API
 * 
 * Proporciona:
 * - Especificación OpenAPI 3.0
 * - Documentación interactiva
 * - Pruebas de API desde navegador
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API - REST',
      version: '1.0.0',
      description: 'API RESTful para gestión de usuarios y pedidos',
      contact: {
        name: 'Felipe Varas',
        email: 'contact@example.com'
      },
      license: {
        name: 'ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.example.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      schemas: {
        Usuario: {
          type: 'object',
          required: ['nombre', 'email', 'password_hash'],
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'ID único del usuario'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
              description: 'Nombre completo del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@example.com',
              description: 'Email único del usuario'
            },
            password_hash: {
              type: 'string',
              example: 'hashed_password_here',
              description: 'Contraseña hasheada'
            },
            activo: {
              type: 'boolean',
              default: true,
              example: true,
              description: 'Estado del usuario'
            },
            fecha_creacion: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Fecha de creación'
            },
            fecha_actualizacion: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Última fecha de actualización'
            }
          }
        },
        UsuarioCrear: {
          type: 'object',
          required: ['nombre', 'email', 'password_hash'],
          properties: {
            nombre: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@example.com'
            },
            password_hash: {
              type: 'string',
              minLength: 6,
              example: 'password123'
            },
            activo: {
              type: 'boolean',
              default: true
            }
          }
        },
        Pedido: {
          type: 'object',
          required: ['usuario_id', 'numero_pedido', 'monto_total'],
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            usuario_id: {
              type: 'integer',
              example: 1,
              description: 'ID del usuario propietario del pedido'
            },
            numero_pedido: {
              type: 'string',
              example: 'PED-2024-001',
              description: 'Número de pedido único'
            },
            descripcion: {
              type: 'string',
              example: 'Pedido de productos varios',
              description: 'Descripción opcional del pedido'
            },
            monto_total: {
              type: 'number',
              format: 'decimal',
              example: 150.50,
              description: 'Monto total del pedido'
            },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'],
              default: 'PENDIENTE',
              example: 'PENDIENTE'
            },
            fecha_pedido: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            fecha_entrega_estimada: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00Z',
              description: 'Fecha estimada de entrega'
            },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        },
        PedidoCrear: {
          type: 'object',
          required: ['usuario_id', 'numero_pedido', 'monto_total'],
          properties: {
            usuario_id: {
              type: 'integer',
              example: 1
            },
            numero_pedido: {
              type: 'string',
              example: 'PED-2024-001',
              minLength: 3,
              maxLength: 50
            },
            descripcion: {
              type: 'string',
              maxLength: 1000
            },
            monto_total: {
              type: 'number',
              format: 'decimal',
              example: 150.50,
              minimum: 0
            },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'],
              default: 'PENDIENTE'
            },
            fecha_entrega_estimada: {
              type: 'string',
              format: 'date'
            }
          }
        },
        Producto: {
          type: 'object',
          required: ['nombre', 'precio'],
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            nombre: {
              type: 'string',
              example: 'Laptop Dell',
              description: 'Nombre del producto'
            },
            descripcion: {
              type: 'string',
              example: 'Laptop de 15 pulgadas',
              description: 'Descripción detallada del producto'
            },
            precio: {
              type: 'number',
              format: 'decimal',
              example: 999.99,
              description: 'Precio unitario'
            },
            stock: {
              type: 'integer',
              example: 50,
              description: 'Cantidad en inventario'
            },
            activo: {
              type: 'boolean',
              default: true,
              description: 'Indicador de disponibilidad'
            },
            fecha_creacion: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductoCrear: {
          type: 'object',
          required: ['nombre', 'precio'],
          properties: {
            nombre: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Laptop Dell'
            },
            descripcion: {
              type: 'string',
              maxLength: 500,
              example: 'Laptop de 15 pulgadas'
            },
            precio: {
              type: 'number',
              format: 'decimal',
              example: 999.99,
              minimum: 0
            },
            stock: {
              type: 'integer',
              minimum: 0,
              default: 0,
              example: 50
            },
            activo: {
              type: 'boolean',
              default: true
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Descripción del error'
            },
            details: {
              type: 'string',
              example: 'Detalles adicionales del error (solo en desarrollo)'
            }
          }
        },
        Paginacion: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 10 },
            totalRecords: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Usuarios',
        description: 'Operaciones CRUD sobre usuarios'
      },
      {
        name: 'Pedidos',
        description: 'Operaciones CRUD sobre pedidos'
      },
      {
        name: 'Productos',
        description: 'Operaciones CRUD sobre productos'
      },
      {
        name: 'Health Check',
        description: 'Verificación del estado de la API'
      }
    ]
  },
  apis: [
    './routes/usuarios.js',
    './routes/pedidos.js',
    './routes/productos.js',
    './routes/status.js'
  ]
};

module.exports = swaggerJsdoc(options);
