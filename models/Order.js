/**
 * Modelo Order (Pedido) - Mapea tabla 'pedidos'
 * 
 * Relación: Un Usuario tiene muchos Pedidos
 * Un Pedido pertenece a un Usuario
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Pedido',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // Relación con tabla usuarios
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'CASCADE',  // Si se elimina usuario, elimina sus pedidos
        onUpdate: 'CASCADE'
      },

      numero_pedido: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'El número de pedido debe ser único'
        },
        validate: {
          notEmpty: { msg: 'Número de pedido no puede estar vacío' }
        }
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 1000], msg: 'Máximo 1000 caracteres' }
        }
      },

      monto_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Debe ser un número decimal' },
          min: { args: [0], msg: 'Monto debe ser positivo' }
        }
      },

      estado: {
        type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'),
        defaultValue: 'PENDIENTE',
        validate: {
          isIn: {
            args: [['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']],
            msg: 'Estado inválido'
          }
        }
      },

      fecha_pedido: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },

      fecha_entrega_estimada: {
        type: DataTypes.DATE,
        allowNull: true
      },

      notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },

      fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },
    {
      tableName: 'pedidos',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      underscored: true,
      freezeTableName: true
    }
  );

  /**
   * Método para obtener JSON sin exponer claves sensibles
   */
  Order.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  return Order;
};
