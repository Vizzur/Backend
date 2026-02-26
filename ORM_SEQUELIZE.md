# ORM Sequelize - Comparación SQL vs ORM

## Introducción

Se ha integrado **Sequelize** como ORM (Object-Relational Mapping) al proyecto. Este documento compara el enfoque tradicional con SQL manual versus el ORM, y explica las ventajas encontradas.

---

## 1. Instalación y Configuración

### Instalar Sequelize

```bash
npm install sequelize
```

### Archivos generados:
- `config/sequelize-config.js` - Parámetros de conexión
- `config/sequelize.js` - Inicialización del ORM
- `models/User.js` - Modelo mapeado a tabla usuarios
- `routes/orm.js` - Rutas que usan Sequelize

### Inicializar Sequelize en el servidor:
```javascript
// En index.js
const { syncDatabase } = require('./config/sequelize');
await syncDatabase(false);  // Sincroniza modelos con BD
```

---

## 2. Comparación SQL Manual vs ORM

### Operación: Obtener todos los usuarios

#### **Opción 1: SQL Manual (pg client)**

```javascript
// routes/usuarios.js - Línea ~50
const result = await pool.query(
  `SELECT id, nombre, email, activo, fecha_creacion, fecha_actualizacion 
   FROM usuarios 
   WHERE 1=1 
   ${nombre ? 'AND nombre ILIKE $1' : ''} 
   ${email ? 'AND email ILIKE $2' : ''}
   ORDER BY fecha_creacion DESC
   LIMIT $paramIndex OFFSET $paramIndex2`,
  [nombre ? `%${nombre}%` : null, email ? `%${email}%` : null, limit, offset]
);
```

**Características:**
- ✅ Control total sobre SQL
- ❌ Construcción manual de queries compleja
- ❌ Gestión manual de parámetros ($1, $2, $3...)
- ❌ No hay validación automática

#### **Opción 2: Sequelize ORM**

```javascript
// routes/orm.js - Línea ~20
const { count, rows } = await db.User.findAndCountAll({
  where: {
    nombre: nombre ? { [Op.iLike]: `%${nombre}%` } : undefined,
    email: email ? { [Op.iLike]: `%${email}%` } : undefined,
    activo: activo !== undefined ? activo : undefined
  },
  offset,
  limit: limitNum,
  raw: true,
  order: [['fecha_creacion', 'DESC']]
});
```

**Características:**
- ✅ Sintaxis declarativa y clara
- ✅ Parámetros automáticos (sin riesgo de SQL injection)
- ✅ Obtiene COUNT simultáneamente
- ✅ Validación integrada según modelo
- ✅ Menos líneas de código

---

### Operación: Crear un usuario

#### **SQL Manual (pg client)**

```javascript
// routes/usuarios.js - Línea ~200
const userResult = await pool.query(
  `INSERT INTO usuarios (nombre, email, password_hash, activo, fecha_creacion, fecha_actualizacion)
   VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
   RETURNING id, nombre, email, activo, fecha_creacion, fecha_actualizacion`,
  [nombre, email, hashedPassword, true]
);

// Validación MANUAL de errores
if (userResult.rowCount === 0) {
  throw new Error('No se inserió');
}
const usuario = userResult.rows[0];
```

**Problemas:**
- ❌ Email único se maneja con try/catch
- ❌ Fechas management manual
- ❌ Validación manual de cada campo
- ❌ Manejo de RETURNING manual

#### **Sequelize ORM**

```javascript
// routes/orm.js - Línea ~180
const usuario = await db.User.create({
  nombre,
  email,
  password_hash: password,
  activo: true
  // Las fechas se asignan automáticamente
});
```

**Ventajas:**
- ✅ Validaciones automáticas del modelo
- ✅ Manejo automático de timestamps
- ✅ Errores tipados (SequelizeUniqueConstraintError, etc.)
- ✅ Método toJSON() oculta contraseña automáticamente
- ✅ 4 líneas vs 10+ líneas de SQL

---

### Operación: Actualizar usuario

#### **SQL Manual**

```javascript
// routes/usuarios.js - Línea ~250
let query = 'UPDATE usuarios SET ';
const updates = [];
const params = [];
let paramIndex = 1;

if (nombre) {
  updates.push(`nombre = $${paramIndex++}`);
  params.push(nombre);
}
if (email) {
  updates.push(`email = $${paramIndex++}`);
  params.push(email);
}
if (activo !== undefined) {
  updates.push(`activo = $${paramIndex++}`);
  params.push(activo);
}

updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
query += updates.join(', ') + ` WHERE id = $${paramIndex}`;
params.push(id);

const result = await pool.query(query, params);
```

**Complejidad:**
- ❌ 15+ líneas solo para construir query
- ❌ Gestión manual de índices de parámetros
- ❌ Fácil de cometer errores

#### **Sequelize ORM**

```javascript
// routes/orm.js - Línea ~230
const usuario = await db.User.findByPk(userId);
await usuario.update({
  ...(nombre && { nombre }),
  ...(email && { email }),
  ...(activo !== undefined && { activo })
});
```

**Simplicidad:**
- ✅ 3 líneas de código
- ✅ Timestamp automático
- ✅ Validaciones automáticas
- ✅ Transaccional por defecto

---

### Operación: Eliminar usuario

#### **SQL Manual**

```javascript
// routes/usuarios.js - Línea ~300
const checkResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
if (checkResult.rowCount === 0) {
  return res.status(404).json({ error: 'No encontrado' });
}
const deletedUser = checkResult.rows[0];

const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
if (result.rowCount === 0) {
  throw new Error('No se eliminó');
}

res.json({ success: true, deletedUser });
```

**Pasos manuales:**
- ❌ Consulta SELECT antes de DELETE (2 viajes a BD)
- ❌ Validación manual

#### **Sequelize ORM**

```javascript
// routes/orm.js - Línea ~310
const usuario = await db.User.findByPk(userId);
if (!usuario) return res.status(404).json({ error: 'No encontrado' });

const deletedData = usuario.toJSON();
await usuario.destroy();

res.json({ success: true, deletedUser: deletedData });
```

**Optimizaciones:**
- ✅ findByPk + destroy es eficiente
- ✅ Datos en memoria, sin necesidad de segundo query
- ✅ Misma cantidad de líneas pero más clara

---

## 3. Ventajas de Sequelize ORM vs SQL Manual

### ✅ **1. Seguridad contra SQL Injection**

**SQL Manual - Riesgo:**
```javascript
// ❌ VULNERABLE
const result = await pool.query(
  `SELECT * FROM usuarios WHERE email = '${email}'`  // Injection posible
);
```

**Sequelize ORM - Seguro:**
```javascript
// ✅ SEGURO automáticamente
const usuario = await db.User.findOne({
  where: { email }
});
// Sequelize parameteriza automáticamente
```

**Por qué:** Sequelize siempre usa prepared statements internamente, es imposible inyectar SQL.

---

### ✅ **2. Validación Automática**

**SQL Manual:**
```javascript
// Validación manual de cada campo
if (!nombre || nombre.length === 0) {
  throw new Error('Nombre vacío');
}
if (!email.includes('@')) {
  throw new Error('Email inválido');
}
if (email.length > 100) {
  throw new Error('Email muy largo');
}
// ... más validaciones manuales
```

**Sequelize ORM:**
```javascript
// models/User.js
nombre: {
  type: DataTypes.STRING(100),
  allowNull: false,
  validate: {
    notEmpty: { msg: 'El nombre no puede estar vacío' },
    len: { args: [1, 100], msg: 'Entre 1 y 100 caracteres' }
  }
},
email: {
  type: DataTypes.STRING(100),
  allowNull: false,
  unique: { msg: 'Email ya registrado' },
  validate: {
    isEmail: { msg: 'Debe ser un email válido' }
  }
}

// Al crear: validaciones automáticas
try {
  await db.User.create({ nombre, email, password_hash });
} catch (error) {
  if (error.name === 'SequelizeValidationError') {
    // Errores de validación tipados
    console.log(error.errors);  // Array de errores específicos
  }
}
```

**Ventaja:** Una sola definición de validaciones, reutilizada siempre.

---

### ✅ **3. Manejo de Restricciones Automático**

**SQL Manual:**
```javascript
try {
  const result = await pool.query(
    'INSERT INTO usuarios (email) VALUES ($1)',
    [email]
  );
} catch (error) {
  // Debe detectar código de error PostgreSQL
  if (error.code === '23505') {  // Unique violation
    res.status(409).json({ error: 'Email duplicado' });
  } else {
    throw error;
  }
}
```

**Sequelize ORM:**
```javascript
try {
  await db.User.create({ nombre, email, password_hash });
} catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({ error: 'Email duplicado' });
  } else {
    throw error;
  }
}
```

**Ventaja:** Errores tipados y específicos, no códigos numéricos.

---

### ✅ **4. Gestión de Timestamps Automática**

**SQL Manual:**
```javascript
// Debe recordar agregar timestamps
const result = await pool.query(
  `INSERT INTO usuarios 
   (nombre, email, password_hash, fecha_creacion, fecha_actualizacion)
   VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  [nombre, email, password]
);

// Actualización también requiere recordar timestamp
const updateResult = await pool.query(
  `UPDATE usuarios 
   SET nombre = $1, fecha_actualizacion = CURRENT_TIMESTAMP
   WHERE id = $2`,
  [nombre, id]
);
```

**Sequelize ORM:**
```javascript
// Timestamps automáticos - no hay que hacer nada
const usuario = await db.User.create({ nombre, email, password_hash });

await usuario.update({ nombre });
// fecha_actualizacion se asigna automáticamente
```

**Ventaja:** Imposible olvidar los timestamps.

---

### ✅ **5. Relaciones entre Tablas**

**SQL Manual:**
```javascript
// Para implementar relación User → Historial
const usuario = await pool.query(
  'SELECT * FROM usuarios WHERE id = $1',
  [userId]
);

const historial = await pool.query(
  'SELECT * FROM historial_usuarios WHERE usuario_id = $1',
  [userId]
);

// Relacionar manualmente en código
const usuarioConHistorial = {
  ...usuario.rows[0],
  historial: historial.rows
};
```

**Sequelize ORM:**
```javascript
// Definir relación en modelo
User.hasMany(Historial, { foreignKey: 'usuario_id' });

// Usar relación
const usuarioConHistorial = await db.User.findByPk(userId, {
  include: [{ association: 'historial' }]
});
// Hace ambos queries automáticamente
```

**Ventaja:** Relaciones declaradas una sola vez, reutilizadas siempre.

---

### ✅ **6. Migraciones de Esquema**

**SQL Manual:**
```bash
# No hay sistema de migraciones
# Crear tablas manualmente
# Cambios de esquema requieren scripts manually

psql -U postgres usuarios_db < scripts/resetDatabase.js
```

**Sequelize ORM:**
```bash
# Crear migración
npx sequelize migration:create --name add-timestamps

# Ejecutar migraciones
npx sequelize db:migrate

# Revertir
npx sequelize db:migrate:undo
```

**Ventaja:** Control de versiones de esquema, rollbacks automáticos.

---

### ✅ **7. Menos Código, Más Mantenible**

**Comparación de líneas:**

| Operación | SQL Manual | ORM Sequelize | Reducción |
|-----------|-----------|--------------|-----------|
| GET /usuarios con filtros | 30 líneas | 15 líneas | -50% |
| POST crear usuario | 12 líneas | 5 líneas | -58% |
| PUT actualizar | 20 líneas | 5 líneas | -75% |
| DELETE | 15 líneas | 6 líneas | -60% |
| **TOTAL** | **77 líneas** | **31 líneas** | **-60%** |

---

### ✅ **8. Testing más Fácil**

**SQL Manual - Mock complicado:**
```javascript
const mockPool = {
  query: jest.fn().mockResolvedValue({
    rows: [{ id: 1, nombre: 'Juan' }],
    rowCount: 1
  })
};
// Mock debe manejar todos los queries
```

**Sequelize ORM - Mock simple:**
```javascript
db.User.findAll = jest.fn().mockResolvedValue([
  { id: 1, nombre: 'Juan' }
]);
// Mock solo del ORM, no del SQL
```

**Ventaja:** Testing más simple y enfocado en lógica, no en SQL.

---

### ✅ **9. Documentación Automática**

**SQL Manual:**
```javascript
// router.get('/usuarios', async (req, res) => {
//   // Qué parámetros tiene?
//   // Qué campos devuelve?
//   // Qué validaciones aplica?
```

**Sequelize ORM:**
```javascript
// models/User.js documenta TODO
User: {
  nombre: String,
  email: String UNIQUE,
  activo: Boolean
  // Claro qué hay en cada tabla
}
```

**Ventaja:** El modelo es la documentación.

---

### ✅ **10. Escalabilidad**

**SQL Manual - Cambio en tabla:**
```javascript
// Para agregar columna 'teléfono'
// Editar SQL en 5+ lugares
// Editar validaciones en 3+ lugares
// Editar respuestas en 2+ lugares
// Total: ~10 cambios
```

**Sequelize ORM - Cambio en tabla:**
```javascript
// Agregar teléfono al modelo
User.telefono = { type: String };

// Hecho. Sequelize propaga automáticamente
// Total: 1 cambio (en el modelo)
```

**Ventaja:** Cambios centralizados, no dispersos.

---

## 4. Cuándo usar cada uno

### **Usa SQL Manual si:**
- ❌ Necesitas query muy complejos con JOINs avanzados
- ❌ Rendimiento crítico en operaciones ultra-rápidas
- ❌ BD heredada con esquema muy anómalo
- ❌ Migraciones SQL específicas ya existentes

### **Usa Sequelize ORM si (lo más común):**
- ✅ CRUD básico y moderadamente complejo
- ✅ Necesitas validaciones y constraints
- ✅ Múltiples tablas relacionadas
- ✅ Equipo nuevo sin expertise SQL avanzado
- ✅ Necesitas migraciones versionadas
- ✅ Mantenibilidad a largo plazo es prioridad

---

## 5. Implementación Actual

### Arquitectura Híbrida (Recomendada)

El proyecto ahora tiene **ambos enfoques disponibles:**

```
/usuarios         ← SQL Manual (pg client)
/orm/usuarios     ← Sequelize ORM

/comparacion      ← Endpoint que muestra diferencias
```

**Ruta de comparación:**
```bash
GET http://localhost:3000/orm/comparison
```

Devuelve:
```json
{
  "sql": {
    "method": "pg.pool.query('SELECT ...')",
    "approach": "SQL manual con prepared statements",
    "result": [...usuarios],
    "count": 5
  },
  "orm": {
    "method": "db.User.findAll({ limit: 5 })",
    "approach": "Sequelize ORM",
    "result": [...usuarios],
    "count": 5
  },
  "dataMatches": true
}
```

**Conclusión:** Ambos devuelven exactamente los mismos datos.

---

## 6. Endpoints Disponibles

### SQL Manual (/usuarios)
- `GET /usuarios` - Listar usuarios
- `GET /usuarios/:id` - Obtener uno
- `POST /usuarios` - Crear (con transacción)
- `PUT /usuarios/:id` - Actualizar
- `DELETE /usuarios/:id` - Eliminar
- `GET /usuarios/historial/:id` - Auditoría

### Sequelize ORM (/orm/usuarios)
- `GET /orm/usuarios` - Listar con ORM
- `GET /orm/usuarios/:id` - Obtener con ORM
- `POST /orm/usuarios` - Crear con ORM
- `PUT /orm/usuarios/:id` - Actualizar con ORM
- `DELETE /orm/usuarios/:id` - Eliminar con ORM

### Comparación
- `GET /orm/comparison` - Ver SQL vs ORM lado a lado

---

## 7. Ejemplos de Uso

### Crear usuario con ORM
```bash
curl -X POST http://localhost:3000/orm/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Gómez",
    "email": "carlos@example.com",
    "password": "secret123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "source": "Sequelize ORM",
  "data": {
    "id": 6,
    "nombre": "Carlos Gómez",
    "email": "carlos@example.com",
    "activo": true,
    "fecha_creacion": "2026-02-25T16:30:00.000Z",
    "fecha_actualizacion": "2026-02-25T16:30:00.000Z"
  }
}
```

### Listar con filtros (ORM)
```bash
curl "http://localhost:3000/orm/usuarios?nombre=Carlos&activo=true&limit=10"
```

### Actualizar (ORM)
```bash
curl -X PUT http://localhost:3000/orm/usuarios/6 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos González"}'
```

### Comparar SQL vs ORM
```bash
curl http://localhost:3000/orm/comparison | jq .
```

---

## 8. Sumario de Ventajas

| Aspecto | SQL Manual | Sequelize ORM |
|--------|-----------|---------------|
| **Seguridad SQL Injection** | Manual | ✅ Automática |
| **Validación** | Manual | ✅ Integrada en modelo |
| **Timestamps** | Manual | ✅ Automáticos |
| **Restricciones** | Códigos de error | ✅ Errores tipados |
| **Relaciones** | Manual JOIN | ✅ Automático include |
| **Migraciones** | Scripts SQL | ✅ Versionadas |
| **Líneas de código** | 30-50 | ✅ 5-15 |
| **Testing** | Difícil mock | ✅ Fácil mock |
| **Mantenibilidad** | Dispersa | ✅ Centralizada |
| **Escalabilidad** | Alta complejidad | ✅ Cambios simples |
| **Curva de aprendizaje** | Moderada | ✅ Baja |

---

## 9. Conclusión

**Sequelize ORM es superior para la mayoría de proyectos porque:**

1. **Reduce complejidad:** 60% menos código
2. **Mejora seguridad:** Validaciones automáticas e inyección imposible
3. **Acelera desarrollo:** Modelos sirven como documentación
4. **Facilita mantenimiento:** Cambios centralizados
5. **Permite escalado:** Agregar tablas sin refactorizar código existente
6. **Proporciona herramientas:** Migraciones, seeds, factories

**Para este proyecto:** Se implementó arquitectura híbrida donde ambos enfoques coexisten. SQL manual sigue siendo útil para queries muy complejos, pero Sequelize será el enfoque preferido para CRUD estándar.
