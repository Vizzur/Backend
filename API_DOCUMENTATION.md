# 📚 Documentación API REST - Backend

## 📋 Contenido

1. [Descripción General](#descripción-general)
2. [Estructura de Endpoints](#estructura-de-endpoints)
3. [Convenciones REST](#convenciones-rest)
4. [Documentación Swagger](#documentación-swagger)
5. [Guía de Postman](#guía-de-postman)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Códigos de Estado HTTP](#códigos-de-estado-http)

---

## Descripción General

Esta API REST proporciona funcionalidades completas para gestionar:
- **👥 Usuarios** - CRUD con filtrado y paginación
- **🛍️ Productos** - Gestión de inventario
- **📦 Pedidos** - Gestión de órdenes de compra
- **🔗 Relaciones** - Conexión entre usuarios y pedidos

**URL Base**: `http://localhost:3000`

**Documentación Interactiva**: `http://localhost:3000/api-docs`

---

## Estructura de Endpoints

### 1️⃣ Usuarios (`/usuarios`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/usuarios` | Listar usuarios (con paginación y filtros) |
| **GET** | `/usuarios/:id` | Obtener usuario específico |
| **POST** | `/usuarios` | Crear nuevo usuario |
| **PUT** | `/usuarios/:id` | Actualizar usuario |
| **DELETE** | `/usuarios/:id` | Eliminar usuario |

#### Parámetros GET `/usuarios`

```
- nombre: string (opcional) - Búsqueda parcial por nombre
- email: string (opcional) - Búsqueda parcial por email
- activo: boolean (opcional) - Filtrar por estado
- page: integer (default: 1) - Número de página
- limit: integer (default: 10, max: 100) - Registros por página
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "activo": true,
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "fecha_actualizacion": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalRecords": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "message": "1 usuario(s) encontrado(s)"
}
```

---

### 2️⃣ Productos (`/productos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/productos` | Listar productos (con filtros avanzados) |
| **GET** | `/productos/:id` | Obtener producto específico |
| **POST** | `/productos` | Crear nuevo producto |
| **PUT** | `/productos/:id` | Actualizar producto |
| **DELETE** | `/productos/:id` | Eliminar producto (lógico) |

#### Parámetros GET `/productos`

```
- nombre: string (opcional) - Búsqueda por nombre
- precio_min: number (opcional) - Precio mínimo
- precio_max: number (opcional) - Precio máximo
- activo: boolean (opcional) - Solo productos activos
- ordenar: enum [nombre|precio|stock|fecha] (default: fecha)
- page: integer (default: 1)
- limit: integer (default: 10, max: 100)
```

#### Body POST/PUT

```json
{
  "nombre": "Laptop Dell XPS 15",
  "descripcion": "Laptop de 15 pulgadas",
  "precio": 1299.99,
  "stock": 50,
  "activo": true
}
```

---

### 3️⃣ Pedidos (`/orm/pedidos`, `/usuarios/:userId/pedidos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/orm/pedidos` | Listar todos los pedidos |
| **GET** | `/orm/usuarios/:id/pedidos` | Pedidos de un usuario |
| **GET** | `/orm/usuario/:id` | Usuario con pedidos anidados |
| **POST** | `/orm/pedidos` | Crear nuevo pedido |
| **PUT** | `/orm/pedidos/:id` | Actualizar pedido |
| **DELETE** | `/orm/pedidos/:id` | Eliminar pedido |

#### Estados de Pedido

```
- PENDIENTE: Pedido inicial
- CONFIRMADO: Pedido confirmado
- ENVIADO: Pedido en tránsito
- ENTREGADO: Pedido entregado
- CANCELADO: Pedido cancelado
```

#### Body POST

```json
{
  "usuario_id": 1,
  "numero_pedido": "PED-2024-001",
  "descripcion": "Pedido de productos varios",
  "monto_total": 150.50,
  "estado": "PENDIENTE",
  "fecha_entrega_estimada": "2024-01-20"
}
```

---

## Convenciones REST

Esta API sigue las mejores prácticas de diseño RESTful:

### 1. **Nombres de Recursos (Sustantivos)**
```
✅ CORRECTO: /usuarios, /productos, /pedidos
❌ INCORRECTO: /getUsuarios, /createProducto, /delete_pedido
```

### 2. **Métodos HTTP Semánticos**
```
GET    /recursos         → Listar o buscar
GET    /recursos/:id     → Obtener uno específico
POST   /recursos         → Crear nuevo
PUT    /recursos/:id     → Actualizar completo
PATCH  /recursos/:id     → Actualizar parcial
DELETE /recursos/:id     → Eliminar
```

### 3. **Paginación**
```
GET /usuarios?page=2&limit=20
GET /productos?page=1&limit=50
```

### 4. **Filtrado y Búsqueda**
```
GET /usuarios?nombre=Juan&activo=true
GET /productos?precio_min=100&precio_max=500
GET /pedidos?estado=PENDIENTE
```

### 5. **Respuestas Consistentes**
```json
{
  "success": boolean,
  "data": object|array,
  "message": string,
  "pagination": object (si aplica),
  "error": string (si hay error)
}
```

### 6. **Códigos de Estado HTTP**
```
200 OK              - Request exitoso
201 Created         - Recurso creado
400 Bad Request     - Validación fallida
404 Not Found       - Recurso no encontrado
409 Conflict        - Duplicado (ej: email existe)
500 Server Error    - Error del servidor
```

---

## Documentación Swagger

### Acceder a Swagger UI

**URL**: `http://localhost:3000/api-docs`

Swagger proporciona:
- ✅ Interfaz interactiva para explorar endpoints
- ✅ Modelos de datos documentados
- ✅ Pruebas directas desde el navegador
- ✅ Ejemplos de requests/responses
- ✅ Validaciones automáticas

### Características

1. **Exploración**: Navega por todos los endpoints
2. **Pruebas**: Haz requests directamente desde Swagger
3. **Documentación**: Ve schemas y tipos de datos
4. **Ejemplos**: Observa requests y responses de ejemplo

---

## Guía de Postman

### Importar Colección

1. Abre Postman
2. Click en "Import"
3. Selecciona `postman_collection.json` del proyecto
4. Elige "Import"

### Usar la Colección

La colección incluye 4 categorías:

#### 📋 Health Check
- Verifica el estado de la API

#### 👥 Usuarios
- Listar, crear, actualizar, eliminar usuarios
- Incluye ejemplos de paginación y filtrado

#### 🛍️ Productos
- Gestión completa de inventario
- Filtros por precio, nombre y estado

#### 📦 Pedidos
- Gestión de órdenes
- Relaciones usuario-pedido
- Cambio de estados

#### 🔗 Relaciones ORM
- Demuestra consultas con include()
- Optimización de queries

---

## Ejemplos de Uso

### Crear Usuario

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password_hash": "hashed_password",
    "activo": true
  }'
```

**Respuesta (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "activo": true
  },
  "message": "Usuario creado exitosamente"
}
```

---

### Listar Usuarios con Filtros

```bash
curl "http://localhost:3000/usuarios?nombre=Juan&activo=true&page=1&limit=10"
```

---

### Crear Producto

```bash
curl -X POST http://localhost:3000/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Laptop Dell",
    "descripcion": "Laptop de 15 pulgadas",
    "precio": 1299.99,
    "stock": 50,
    "activo": true
  }'
```

---

### Crear Pedido

```bash
curl -X POST http://localhost:3000/orm/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "numero_pedido": "PED-2024-001",
    "monto_total": 150.50,
    "estado": "PENDIENTE"
  }'
```

---

### Actualizar Estado de Pedido

```bash
curl -X PUT http://localhost:3000/orm/pedidos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "CONFIRMADO",
    "descripcion": "Pedido confirmado"
  }'
```

---

### Obtener Usuario con Pedidos

```bash
curl "http://localhost:3000/orm/usuario/1"
```

**Respuesta**:
```json
{
  "success": true,
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "pedidos": [
      {
        "id": 1,
        "numero_pedido": "PED-2024-001",
        "monto_total": 150.50,
        "estado": "PENDIENTE"
      }
    ]
  },
  "totalPedidos": 1
}
```

---

## Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| **200** | OK - Request exitoso | GET, PUT, PATCH |
| **201** | Created - Recurso creado | POST exitoso |
| **400** | Bad Request - Datos inválidos | Email inválido, campos requeridos |
| **404** | Not Found - Recurso no existe | Usuario ID no encontrado |
| **409** | Conflict - Violación de restricción | Email ya registrado |
| **500** | Server Error - Error del servidor | Excepción no manejada |

---

## 🚀 Iniciar la API

```bash
# Instalación de dependencias
npm install

# Desarrollo (con nodemon)
npm run dev

# Producción
npm start

# Resetear base de datos
npm run db:setup
```

---

## 📊 Estructura de la Base de Datos

### Tabla: usuarios
```
- id (bigserial, PK)
- nombre (varchar 100)
- email (varchar 100, UNIQUE)
- password_hash (varchar 255)
- activo (boolean, default true)
- fecha_creacion (timestamp)
- fecha_actualizacion (timestamp)
```

### Tabla: productos
```
- id (bigserial, PK)
- nombre (varchar 100)
- descripcion (text)
- precio (decimal 10,2)
- stock (integer)
- activo (boolean, default true)
- fecha_creacion (timestamp)
```

### Tabla: pedidos
```
- id (bigserial, PK)
- usuario_id (bigint, FK)
- numero_pedido (varchar 50, UNIQUE)
- descripcion (text)
- monto_total (decimal 10,2)
- estado (enum, default PENDIENTE)
- fecha_pedido (timestamp)
- fecha_entrega_estimada (timestamp)
```

---

## 💡 Tips

1. **Paginación**: Siempre usa paginación para grandes conjuntos de datos
2. **Filtros**: Aprovecha los filtros para búsquedas específicas
3. **Validación**: Lee los mensajes de error para corregir requests
4. **Performance**: Usa include() en Sequelize para evitar N+1 queries
5. **Swagger**: Consulta `/api-docs` para documentación interactiva

---

## 🔐 Notas de Seguridad

- Todos los passwords deben estar hasheados (implementar en futuro)
- Implementar autenticación JWT
- HTTPS en producción
- Rate limiting en producción
- CORS configurado según necesidad

---

**Última actualización**: 13 de abril de 2024
