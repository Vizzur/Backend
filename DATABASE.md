# Documentación de Base de Datos

## Descripción General
Se ha implementado una conexión a PostgreSQL con credenciales protegidas mediante variables de entorno, siguiendo mejores prácticas de seguridad.

---

## 1. ¿Por qué elegiste **pg** como cliente de conexión?

### Razones principales:

#### **Estabilidad y confiabilidad**
- `pg` es el cliente PostgreSQL más popular y ampliamente utilizado en el ecosistema Node.js
- Tiene más de 10 millones de descargas semanales en npm
- Mantenimiento activo y comunidad robusta

#### **Rendimiento**
- Utiliza un **Pool de conexiones**, que reutiliza conexiones en lugar de crear nuevas en cada consulta
- Mejora significativamente el rendimiento en aplicaciones con múltiples consultas simultáneas
- Reduce la latencia de conexión

#### **Características nativas**
- Soporte para **consultas preparadas** (prepared statements) contra inyección SQL
- Manejo automático de tipos de datos PostgreSQL
- Soporte para transacciones ACID
- Event-driven architecture con listeners para eventos de conexión/error

#### **Compatibilidad**
- Compatible con PostgreSQL 9.6 y versiones posteriores
- Excelente documentación oficial
- Integración seamless con frameworks como Express

### Alternativas consideradas:
| Cliente | Ventaja | Desventaja |
|---------|---------|-----------|
| **pg** | Pool nativo, preparado | Más bajo nivel que ORMs |
| **knex.js** | Query builder | Dependencia extra, más overhead |
| **sequelize** | ORM completo | Overhead de mapeo, curva aprendizaje |
| **prisma** | Moderno, type-safe | Requiere archivo .prisma extra |

---

## 2. ¿Cómo se protegen los datos sensibles?

### Implementación de seguridad:

#### **a) Variables de Entorno (.env)**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usuarios_db
DB_USER=postgres
DB_PASSWORD=password123
DB_SSL=false
```

**Protecciones:**
- **Archivo .env en .gitignore** (no se comitea al repositorio)
- **Archivo .env.example** con valores placeholder para referencia
- Credenciales nunca en código fuente
- Valores cargados con `require('dotenv').config()`

#### **b) Configuración del Pool de Conexiones**
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,        // Desde variables de entorno
  port: process.env.DB_PORT,        // Desde variables de entorno
  database: process.env.DB_NAME,    // Desde variables de entorno
  user: process.env.DB_USER,        // Desde variables de entorno
  password: process.env.DB_PASSWORD,// Desde variables de entorno
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
```

**Seguridad:**
- SSL/TLS disponible para conexiones en producción
- Credenciales extraídas de variables de entorno, NO hardcodeadas
- Control de acceso a nivel de base de datos (usuario específico)

#### **c) Prepared Statements (Consultas Preparadas)**
El cliente `pg` utiliza prepared statements por defecto:
```javascript
// SEGURO contra inyección SQL
const result = await pool.query(
  'SELECT * FROM usuarios WHERE email = $1',
  [email]  // Parámetro separado de la consulta
);
```

**NO hacer:**
```javascript
// INSEGURO - Vulnerable a SQL injection
const result = await pool.query(
  `SELECT * FROM usuarios WHERE email = '${email}'`
);
```

#### **d) Manejo de Contraseñas de Usuario**
```sql
-- Las contraseñas NUNCA se almacenan en texto plano
-- La columna usa password_hash (será hasheada con bcrypt en implementación futura)
CREATE TABLE usuarios (
  ...
  password_hash VARCHAR(255) NOT NULL,  -- Nunca texto plano
  ...
);
```

#### **e) Logging Controlado**
```javascript
pool.on('connect', () => {
  console.log('[✓] Conectado a PostgreSQL exitosamente');
});

pool.on('error', (err) => {
  console.error('[✗] Error en el pool:', err);
});
```

**Protecciones:**
- Los logs NO incluyen credenciales
- Manejo de errores sin exponer detalles sensibles
- Eventos monitoreados para detectar problemas

---

## 3. Estructura de la Tabla de Usuarios

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,                    -- ID auto-incrementable único
  nombre VARCHAR(100) NOT NULL,             -- Nombre del usuario
  email VARCHAR(100) UNIQUE NOT NULL,       -- Email único (índice automático)
  password_hash VARCHAR(255) NOT NULL,      -- Hash de contraseña (nunca texto plano)
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Auditoría
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Auditoría
  activo BOOLEAN DEFAULT true               -- Control de estado
);
```

---

## 4. Configuración Actual

### Archivos creados:
- `.env` - Credenciales locales (NO en repositorio)
- `.env.example` - Template para otros desarrolladores
- `config/database.js` - Módulo de conexión reutilizable
- `index.js` - Actualizado con conexión a BD

### Para usar:

#### **1. Crear base de datos PostgreSQL:**
```bash
createdb usuarios_db
```

#### **2. Actualizar .env si es necesario:**
Editar `/home/vizur/Projects/Backend/.env` con tus credenciales reales

#### **3. Instalar dependencia:**
```bash
npm install pg
```

#### **4. Iniciar servidor:**
```bash
npm run dev
```

**Salida esperada:**
```
[✓] Servidor ejecutándose en http://localhost:3000
[✓] Test de conexión exitoso a PostgreSQL
[✓] Tabla "usuarios" verificada/creada exitosamente
[✓] Sistema listo para usar
```

---

## 5. Ruta GET /usuarios - Consulta Segura de Usuarios

### Descripción
Endpoint que devuelve lista de usuarios desde la BD con procesamiento seguro de datos (sin mostrar contraseñas).

### Características implementadas:

#### **a) Endpoint GET /usuarios**
```bash
GET http://localhost:3000/usuarios
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "activo": true,
      "fecha_creacion": "2026-02-25T10:30:00.000Z",
      "fecha_actualizacion": "2026-02-25T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalRecords": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "filters": {
    "nombre": null,
    "email": null,
    "activo": null
  },
  "message": "5 usuario(s) encontrado(s)"
}
```

#### **b) Query Parameters Disponibles** (PLUS - Paginación y Filtrado)

```bash
# Búsqueda por nombre (parcial)
GET /usuarios?nombre=Juan

# Búsqueda por email (parcial)
GET /usuarios?email=juan@

# Filtrar por estado activo
GET /usuarios?activo=true

# Paginación
GET /usuarios?page=1&limit=10

# Combinado
GET /usuarios?nombre=Juan&activo=true&page=1&limit=5
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `nombre` | string | null | Búsqueda parcial en nombres (case-insensitive) |
| `email` | string | null | Búsqueda parcial en emails (case-insensitive) |
| `activo` | true/false | null | Filtrar por estado del usuario |
| `page` | number | 1 | Número de página |
| `limit` | number | 10 | Registros por página (máx: 100) |

#### **c) Endpoint GET /usuarios/:id**
Obtiene un usuario específico por ID:
```bash
GET /usuarios/1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "activo": true,
    "fecha_creacion": "2026-02-25T10:30:00.000Z",
    "fecha_actualizacion": "2026-02-25T10:30:00.000Z"
  },
  "message": "Usuario obtenido exitosamente"
}
```

### Seguridad Implementada:

**Sin exposición de contraseñas**
- Se selecciona explícitamente: `id, nombre, email, activo, fecha_creacion, fecha_actualizacion`
- La columna `password_hash` NUNCA se incluye en la respuesta

**Prepared Statements**
- Parámetros separados de la consulta SQL
- Protección automática contra SQL injection

**Validación de entrada**
- IDs validados como números positivos
- Límite máximo de registros por página (100)
- Búsquedas escapadas con ILIKE para evitar inyecciones

**Manejo de errores**
- Mensajes genéricos en producción (detalles solo en development)
- Códigos HTTP apropiados (400, 404, 500)
- Logs detallados en servidor

**Performance**
- Índices en columnas frecuentes (email, activo, fecha_creacion)
- Paginación para no sobrecargar el servidor
- Conteo eficiente de registros

### Respuestas de Error:

**Parámetro inválido (400):**
```json
{
  "success": false,
  "error": "El ID debe ser un número positivo"
}
```

**Usuario no encontrado (404):**
```json
{
  "success": false,
  "error": "Usuario no encontrado",
  "id": 999
}
```

**Error de base de datos (500):**
```json
{
  "success": false,
  "error": "Error al consultar la base de datos",
  "message": "No fue posible obtener los usuarios en este momento"
}
```

---

## 6. Scripts de Gestión de Base de Datos

### Inicializar BD con datos simulados:
```bash
npm run db:setup
```

Esto ejecuta en orden:
1. `npm run db:reset` - Crea tabla desde cero
2. `npm run db:seed` - Inserta 5 usuarios simulados

### Resetear BD manualmente:
```bash
npm run db:reset
```

### Insertar datos simulados:
```bash
npm run db:seed
```

### Usuarios simulados incluidos:
1. **Juan Pérez** - juan@example.com
2. **María García** - maria@example.com
3. **Carlos López** - carlos@example.com
4. **Ana Martínez** - ana@example.com
5. **Roberto Sánchez** - roberto@example.com

*Nota: Las contraseñas son placeholders de bcrypt y no están funcionales*

---

## 7. Rutas PUT y DELETE - CRUD Completo

### PUT /usuarios/:id - Actualizar Usuario

**Campos actualizables:**
- `nombre` - String no vacío
- `email` - Email válido y único
- `activo` - Boolean (true/false)

**Campos protegidos (NO editables):**
- `id` - Clave primaria
- `password_hash` - Seguridad
- `fecha_creacion` - Auditoría
- `fecha_actualizacion` - Se actualiza automáticamente

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Nuevo","activo":false}'
```

**Validaciones:**
- ID debe ser número positivo
- Al menos un campo a actualizar
- Email debe ser válido (contiene @)
- Activo debe ser boolean
- Usuario debe existir (404 si no)
- Email no puede estar duplicado (409 si existe)

### DELETE /usuarios/:id - Eliminar Usuario

**Validaciones previas:**
- ID debe ser número positivo
- Usuario debe existir ANTES de eliminar

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/usuarios/1
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente",
  "deletedUser": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

---

## 8. Tabla Historial de Usuarios - Auditoría

### Propósito
Registrar simultáneamente cada operación en usuarios para auditoría, integridad de datos y cumplimiento regulatorio.

### Estructura

```sql
CREATE TABLE historial_usuarios (
  id SERIAL PRIMARY KEY,                              -- ID único del registro de historial
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,  -- Usuario modificado
  accion VARCHAR(50) NOT NULL,                        -- Tipo de operación (REGISTRO, ACTUALIZAR, ELIMINAR)
  detalles_anteriores JSONB,                          -- Estado anterior (null si REGISTRO)
  detalles_nuevos JSONB NOT NULL,                     -- Nuevo estado
  fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Cuándo ocurrió
  ip_origen VARCHAR(45),                              -- IPv4/IPv6 para trazabilidad (opcional)
  usuario_log VARCHAR(100)                            -- Quién realizó la operación (opcional)
);
```

### Campos Explicados:

| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| `id` | SERIAL | Identificador único | 1, 2, 3... |
| `usuario_id` | INTEGER FK | Quién fue modificado | 5 (referencia a usuarios.id) |
| `accion` | VARCHAR(50) | Tipo de cambio | REGISTRO, ACTUALIZAR, ELIMINAR |
| `detalles_anteriores` | JSONB | Estado antes del cambio | `{"nombre":"Juan","email":"juan@old.com"}` |
| `detalles_nuevos` | JSONB | Estado después del cambio | `{"nombre":"Juan Nuevo","email":"juan@new.com"}` |
| `fecha_evento` | TIMESTAMP | Cuándo sucedió | 2026-02-25T15:30:00.000Z |
| `ip_origen` | VARCHAR(45) | Desde dónde se realizó | 192.168.1.1 |
| `usuario_log` | VARCHAR(100) | Sistema/usuario que lo ejecutó | "admin", "api", "cron" |

### Índices para Performance

```sql
-- Buscar cambios de un usuario específico
CREATE INDEX idx_historial_usuario_id ON historial_usuarios(usuario_id);

-- Filtrar por tipo de acción
CREATE INDEX idx_historial_accion ON historial_usuarios(accion);

-- Ordenar por fecha
CREATE INDEX idx_historial_fecha ON historial_usuarios(fecha_evento DESC);
```

### Ejemplos de Registros Automáticos

**1. Crear usuario (acción: REGISTRO)**
```json
{
  "id": 1,
  "usuario_id": 5,
  "accion": "REGISTRO",
  "detalles_anteriores": null,
  "detalles_nuevos": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "activo": true
  },
  "fecha_evento": "2026-02-25T10:00:00.000Z"
}
```

**2. Actualizar usuario (acción: ACTUALIZAR)**
```json
{
  "id": 2,
  "usuario_id": 5,
  "accion": "ACTUALIZAR",
  "detalles_anteriores": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  },
  "detalles_nuevos": {
    "nombre": "Juan Carlos Pérez",
    "email": "juancarlos@example.com"
  },
  "fecha_evento": "2026-02-25T12:30:00.000Z"
}
```

**3. Eliminar usuario (acción: ELIMINAR)**
```json
{
  "id": 3,
  "usuario_id": 5,
  "accion": "ELIMINAR",
  "detalles_anteriores": {
    "nombre": "Juan Carlos Pérez",
    "email": "juancarlos@example.com",
    "activo": false
  },
  "detalles_nuevos": null,
  "fecha_evento": "2026-02-25T14:15:00.000Z"
}
```

### Relación con Tabla usuarios

```
usuarios (1) ──────── (N) historial_usuarios
  ↓ ON DELETE CASCADE
  Cuando se elimina un usuario, sus registros de historial se eliminan automáticamente
```

---

## 9. Transacciones ACID - POST /usuarios

### ¿Qué es una Transacción ACID?

**ACID** garantiza confiabilidad en operaciones múltiples:

- **A (Atomicidad):** Todos los pasos ocurren o ninguno (sin estados intermedios vulnerables)
- **C (Consistencia):** La BD siempre está en estado válido
- **I (Aislamiento):** Transacciones paralelas no interfieren
- **D (Durabilidad):** Una vez confirmada, los datos persisten

### Patrón de Implementación

```javascript
// En config/database.js
async function executeTransaction(transactionName, operations) {
  const client = await pool.connect();
  
  try {
    console.log(`[TRANSACCIÓN INICIADA] ${transactionName}`);
    await client.query('BEGIN');
    
    // Ejecutar operaciones dentro de la transacción
    const result = await operations(client);
    
    await client.query('COMMIT');
    console.log(`[TRANSACCIÓN EXITOSA] ${transactionName}`);
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.log(`[TRANSACCIÓN CANCELADA] ${transactionName} - ${error.message}`);
    logTransactionError(transactionName, error);
    throw error;
  } finally {
    client.release();
  }
}
```

### Endpoint POST /usuarios - Crear Usuario + Registrar en Historial

**Flujo de Transacción:**
```
1. BEGIN TRANSACTION
   ├─ INSERT INTO usuarios (nombre, email, password_hash, activo)
   ├─ Obtener usuario_id del INSERT anterior
   ├─ INSERT INTO historial_usuarios con acción 'REGISTRO'
   └─ (Si error en cualquier paso → ROLLBACK automático)
2. COMMIT TRANSACTION (ambos INSERTs juntos, o ninguno)
```

**Ejemplo de uso:**
```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Nuevo",
    "email": "carlos.nuevo@example.com",
    "password": "secreto123"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "usuario": {
    "id": 6,
    "nombre": "Carlos Nuevo",
    "email": "carlos.nuevo@example.com",
    "activo": true,
    "fecha_creacion": "2026-02-25T15:45:00.000Z",
    "fecha_actualizacion": "2026-02-25T15:45:00.000Z"
  },
  "historialId": 11,
  "message": "Usuario creado exitosamente con historial registrado"
}
```

**Respuesta con rollback (500):**
```json
{
  "success": false,
  "statusCode": 500,
  "error": "Error en transacción",
  "details": "No se creó el usuario ni su historial (ROLLBACK automático)"
}
```

### Garantías ACID en Acción

**Atomicidad:**
- Si el email está duplicado, AMBOS INSERTs se revierten
- No hay usuario sin historial ni historial sin usuario
- Imposible estado inconsistente

**Consistencia:**
- Las restricciones de FK se validan antes de COMMIT
- Email UNIQUE se verifica durante transacción
- Restricciones de NOT NULL forzadas

**Aislamiento:**
- Otros clientes no ven cambios hasta COMMIT final
- Lecturas "dirty" imposibles

**Durabilidad:**
- Una vez COMMIT exitoso, el disco registra los datos
- Incluso si servidor cae, los datos persisten

### Manejo de Errores Transaccionales

```javascript
// Validaciones ANTES de iniciar transacción
if (!nombre || !email || !password) {
  return res.status(400).json({ error: "Campos requeridos" });
}

// Dentro de transacción: errores hacen ROLLBACK automático
const result = await executeTransaction('Crear Usuario + Historial', async (client) => {
  // INSERT 1: Usuario
  const userResult = await client.query(
    'INSERT INTO usuarios (nombre, email, password_hash, activo) ...'
  );
  const usuarioId = userResult.rows[0].id;
  
  // Simulación de error (para testing)
  if (forceError) {
    throw new Error('Error simulado para probar ROLLBACK');
  }
  
  // INSERT 2: Historial
  const historialResult = await client.query(
    'INSERT INTO historial_usuarios (usuario_id, accion, detalles_nuevos) ...'
  );
  
  return { usuario: userResult.rows[0], historialId: historialResult.rows[0].id };
});
```

### Parámetro de Testing: forceError

Para verificar que ROLLBACK funciona:
```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Rollback",
    "email": "test@rollback.com",
    "password": "test123",
    "forceError": true
  }'
```

**Resultado:**
- No se crea usuario
- No se crea historial
- Logs muestran `[TRANSACCIÓN CANCELADA]`
- Base de datos queda limpia

---

## 10. Endpoint GET /usuarios/historial/:usuarioId

### Descripción
Recupera el historial completo de cambios de un usuario específico.

**Ejemplo:**
```bash
GET /usuarios/historial/5
```

**Respuesta:**
```json
{
  "success": true,
  "usuarioId": 5,
  "totalRegistros": 3,
  "historial": [
    {
      "id": 1,
      "accion": "REGISTRO",
      "detalles_anteriores": null,
      "detalles_nuevos": {
        "nombre": "Juan Pérez",
        "email": "juan@example.com",
        "activo": true
      },
      "fecha_evento": "2026-02-25T10:00:00.000Z"
    },
    {
      "id": 2,
      "accion": "ACTUALIZAR",
      "detalles_anteriores": {
        "nombre": "Juan Pérez"
      },
      "detalles_nuevos": {
        "nombre": "Juan Carlos Pérez"
      },
      "fecha_evento": "2026-02-25T12:30:00.000Z"
    }
  ],
  "message": "Historial obtenido exitosamente"
}
```

### Validaciones
- usuarioId debe ser número positivo
- Usuario debe existir (404 si no existe)
- Respuesta ordenada por fecha descendente (más recientes primero)

---

## 11. Logging de Transacciones Fallidas

### Archivo: logs/transaction-errors.log

Cada transacción fallida se registra automáticamente con:

```
[2026-02-25 15:45:30] TRANSACCIÓN: Crear Usuario + Historial
ERROR: Duplicate key value violates unique constraint "usuarios_email_key"
DETALLES: {"email":"duplicado@example.com"}
---
```

### Función de Logging

```javascript
function logTransactionError(descripcion, detalles) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const logEntry = `[${timestamp}] TRANSACCIÓN: ${descripcion}\n` +
                   `ERROR: ${detalles.message}\n` +
                   `DETALLES: ${JSON.stringify(detalles)}\n` +
                   `---\n`;
  
  fs.appendFileSync('logs/transaction-errors.log', logEntry);
}
```

### Uso Post-Mortem

Para investigar fallos transaccionales:
```bash
tail -50 logs/transaction-errors.log
grep "Email" logs/transaction-errors.log
```

---

## 12. Resumen de Índices de Base de Datos

### Tabla usuarios

```sql
-- Primaria (automática)
CREATE INDEX pk_usuarios ON usuarios(id);

-- Performance para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_usuarios_fecha_creacion ON usuarios(fecha_creacion DESC);
```

### Tabla historial_usuarios

```sql
-- Búsqueda por usuario
CREATE INDEX idx_historial_usuario_id ON historial_usuarios(usuario_id);

-- Filtrado por tipo de acción
CREATE INDEX idx_historial_accion ON historial_usuarios(accion);

-- Ordenamiento temporal eficiente
CREATE INDEX idx_historial_fecha_evento ON historial_usuarios(fecha_evento DESC);
```

**Beneficios:**
- Búsqueda por usuario: O(log n) en lugar de O(n)
- Paginación rápida: LIMIT/OFFSET sin table scan
- Filtrado por acción: Instant para reportes

---

## 13. Diagrama de Relaciones

```
┌─────────────────┐
│    usuarios     │
├─────────────────┤
│ id (PK)         │  ┌──────────────────────────────┐
│ nombre          │  │  historial_usuarios          │
│ email (UNIQUE)  │◄─├──────────────────────────────┤
│ password_hash   │  │ id (PK)                      │
│ activo          │  │ usuario_id (FK) ─────────────┤
│ fecha_creacion  │  │ accion (REGISTRO, UPDATE,...)│
│ fecha_actualizacion│ detalles_anteriores (JSONB) │
└─────────────────┘  │ detalles_nuevos (JSONB)    │
                     │ fecha_evento                │
                     │ ip_origen                   │
                     │ usuario_log                 │
                     └──────────────────────────────┘
        
        (1 usuario puede tener N cambios)
        ON DELETE CASCADE → Eliminar usuario borra su historial
```

---

## 14. Checklist de Verificación

- ✅ Tabla `usuarios` creada con todas las columnas
- ✅ Tabla `historial_usuarios` creada con JSONB y FK
- ✅ Índices en columnas de búsqueda frecuente
- ✅ Conexión con pg pool y environment variables
- ✅ GET /usuarios con filtrado y paginación (PLUS feature)
- ✅ GET /usuarios/:id para consulta individual
- ✅ POST /usuarios con transacción ACID
- ✅ PUT /usuarios/:id con validación de campos
- ✅ DELETE /usuarios/:id con pre-verificación
- ✅ GET /usuarios/historial/:usuarioId para auditoría
- ✅ Logging de errores transaccionales en logs/
- ✅ Prepared statements para prevenir SQL injection
- ✅ Manejo graceful de constraint violations (409 para emails duplicados)