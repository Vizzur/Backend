-- Script SQL para crear tabla de productos
-- Ejecutar solo si la tabla no existe

-- Tabla: productos
-- Almacena información de productos en el inventario

CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para mejorar búsquedas
  CONSTRAINT check_nombre_not_empty CHECK (nombre != '')
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos (precio);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_fecha ON productos (fecha_creacion DESC);

-- Comentarios sobre la tabla
COMMENT ON TABLE productos IS 'Tabla que almacena información de productos disponibles en el inventario';
COMMENT ON COLUMN productos.id IS 'Identificador único del producto';
COMMENT ON COLUMN productos.nombre IS 'Nombre del producto (requerido)';
COMMENT ON COLUMN productos.descripcion IS 'Descripción detallada del producto';
COMMENT ON COLUMN productos.precio IS 'Precio unitario del producto (no puede ser negativo)';
COMMENT ON COLUMN productos.stock IS 'Cantidad disponible en inventario';
COMMENT ON COLUMN productos.activo IS 'Indicador de disponibilidad del producto';
COMMENT ON COLUMN productos.fecha_creacion IS 'Fecha de creación del registro';
COMMENT ON COLUMN productos.fecha_actualizacion IS 'Fecha de última actualización';

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, activo)
VALUES 
  ('Laptop Dell XPS 15', 'Laptop de 15 pulgadas con procesador Intel i7 y 16GB RAM', 1299.99, 50, true),
  ('Monitor LG 27"', 'Monitor 4K de 27 pulgadas', 399.99, 30, true),
  ('Mouse inalámbrico', 'Mouse inalámbrico con batería de larga duración', 29.99, 100, true),
  ('Teclado mecánico', 'Teclado mecánico RGB para gaming', 149.99, 45, true),
  ('Cable HDMI 2.1', 'Cable HDMI 2.1 de 2 metros', 19.99, 200, true)
ON CONFLICT DO NOTHING;
