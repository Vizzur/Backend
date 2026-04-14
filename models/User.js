/**
 * Modelo User - Mapea a tabla 'usuarios' en PostgreSQL
 * 
 * Sequelize proporciona:
 * - Validaciones automáticas
 * - Métodos CRUD simplificados
 * - Relaciones entre tablas
 * - Migraciones automáticas
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'Usuario',  // Nombre del modelo
    {
      // Atributos (columnas)
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'El nombre no puede estar vacío' },
          len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' }
        }
      },
      
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'El email ya está registrado'
        },
        validate: {
          isEmail: { msg: 'Debe ser un email válido' }
        }
      },
      
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'La contraseña no puede estar vacía' }
        }
      },
      
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        validate: {
          isIn: {
            args: [[true, false]],
            msg: 'Activo debe ser true o false'
          }
        }
      },
      
      foto_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            args: true,
            msg: 'Debe ser una URL válida'
          },
          // Validación personalizada: solo valida si hay contenido
          customValidator(value) {
            if (!value || value.trim() === '') {
              // Si está vacío o null, OK
              return;
            }
            // Si tiene contenido, valida que sea URL
            const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
            if (!urlRegex.test(value)) {
              throw new Error('Debe ser una URL válida o estar vacío');
            }
          }
        }
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
      // Opciones del modelo
      tableName: 'usuarios',  // Nombre exacto de la tabla en BD
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      underscored: true,  // Usa snake_case en BD
      freezeTableName: true  // No pluraliza el nombre de tabla
    }
  );
  
  /**
   * Métodos personalizados del modelo
   */
  
  /**
   * Obtener usuario sin mostrar contraseña
   */
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;  // Nunca exponer la contraseña
    return values;
  };
  
  return User;
};
