# 🚀 Quick Start Guide - Backend API

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias Swagger

```bash
npm install swagger-ui-express swagger-jsdoc
```

### 2️⃣ Crear Tabla de Productos

Si aún no tienes la tabla `productos`:

```bash
# Opción 1: Con psql
psql -U tu_usuario -d tu_basedatos -f scripts/create_productos_table.sql

# Opción 2: Copiar el SQL en tu cliente GUI de PostgreSQL
# Ver: scripts/create_productos_table.sql
```

### 3️⃣ Iniciar la API

```bash
# Desarrollo (con hot reload)
npm run dev

# O producción
npm start
```

**Output esperado**:
```
✓ Servidor ejecutándose en puerto 3000
✓ Documentación en http://localhost:3000/api-docs
```

---

## 📚 Acceder a la Documentación

### 🌐 Swagger UI (Recomendado)
```
http://localhost:3000/api-docs
```
- Interface interactiva
- Prueba endpoints directamente
- Ver ejemplos de respuesta
- Validación automática

### 📦 Postman Collection
1. Abre Postman
2. Importa: `postman_collection.json`
3. ¡Listo para usar!

### 📖 Markdown Docs
- `API_DOCUMENTATION.md` - Guía completa
- `ENDPOINT_SCHEMA.md` - Esquemas visuales
- `COMPLETION_SUMMARY.md` - Resumen e historia

---

## 🧪 Primeros Tests

### Test con cURL

```bash
# 1. Verificar estado del servidor
curl http://localhost:3000/status

# 2. Listar usuarios existentes
curl http://localhost:3000/usuarios

# 3. Listar productos
curl http://localhost:3000/productos

# 4. Crear usuario
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Test",
    "email": "juan@test.com",
    "password_hash": "hashed_pwd",
    "activo": true
  }'

# 5. Obtener usuario específico
curl http://localhost:3000/usuarios/1

# 6. Actualizar usuario
curl -X PUT http://localhost:3000/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Actualizado"}'

# 7. Crear producto
curl -X POST http://localhost:3000/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Laptop Test",
    "descripcion": "Test product",
    "precio": 999.99,
    "stock": 10,
    "activo": true
  }'

# 8. Eliminar usuario
curl -X DELETE http://localhost:3000/usuarios/1
```

---

## 📊 Estructura de Recursos

### 👥 Usuarios (5 endpoints)
```
GET    /usuarios              → Listar
GET    /usuarios/1            → Obtener uno
POST   /usuarios              → Crear
PUT    /usuarios/1            → Actualizar
DELETE /usuarios/1            → Eliminar
```

### 🛍️ Productos (5 endpoints)
```
GET    /productos             → Listar
GET    /productos/1           → Obtener uno
POST   /productos             → Crear
PUT    /productos/1           → Actualizar
DELETE /productos/1           → Eliminar
```

### 📦 Pedidos (6 endpoints)
```
GET    /orm/pedidos           → Listar todos
GET    /orm/usuarios/1/pedidos → Pedidos de usuario
GET    /orm/usuario/1          → Usuario con pedidos
POST   /orm/pedidos           → Crear
PUT    /orm/pedidos/1         → Actualizar
DELETE /orm/pedidos/1         → Eliminar
```

---

## 🔍 Filtros y Paginación

### Usuarios
```bash
# Listar con paginación
GET /usuarios?page=1&limit=20

# Buscar por nombre
GET /usuarios?nombre=Juan

# Filtrar activos
GET /usuarios?activo=true

# Combinado
GET /usuarios?nombre=Juan&activo=true&page=2&limit=10
```

### Productos
```bash
# Por precio
GET /productos?precio_min=100&precio_max=500

# Por nombre
GET /productos?nombre=Laptop

# Ordenar
GET /productos?ordenar=precio

# Paginación
GET /productos?page=1&limit=10
```

### Pedidos
```bash
# Por estado
GET /orm/pedidos?estado=PENDIENTE

# Con paginación
GET /orm/pedidos?page=1&limit=10
```

---

## 📝 Crear Recursos

### Usuario Ejemplo
```json
POST /usuarios
{
  "nombre": "María García",
  "email": "maria@example.com",
  "password_hash": "secure_hash_here",
  "activo": true
}
```

### Producto Ejemplo
```json
POST /productos
{
  "nombre": "Mouse Inalámbrico",
  "descripcion": "Mouse ergonómico con batería",
  "precio": 29.99,
  "stock": 100,
  "activo": true
}
```

### Pedido Ejemplo
```json
POST /orm/pedidos
{
  "usuario_id": 1,
  "numero_pedido": "PED-2024-001",
  "descripcion": "Pedido de productos",
  "monto_total": 150.50,
  "estado": "PENDIENTE",
  "fecha_entrega_estimada": "2024-01-20"
}
```

---

## ⚙️ Variables de Entorno

Crear `.env` si no existe:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mibasedatos
DB_USER=miusuario
DB_PASSWORD=micontraseña
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'swagger-ui-express'"
```bash
npm install swagger-ui-express swagger-jsdoc
```

### Error: "Tabla 'productos' no existe"
```bash
# Ejecutar script SQL
psql -U usuario -d basedatos -f scripts/create_productos_table.sql
```

### Error de CORS
- Swagger está en el mismo origen: OK
- Postman usa CORS bypass: OK
- Frontend externo: Configurar CORS en index.js

### Puerto 3000 en uso
```bash
# Usar puerto diferente
PORT=3001 npm run dev
```

---

## 📂 Archivos Importantes

```
📄 API_DOCUMENTATION.md      ← Documentación completa
📄 ENDPOINT_SCHEMA.md        ← Esquemas visuales
📄 COMPLETION_SUMMARY.md     ← Resumen del proyecto
📦 postman_collection.json   ← Colección Postman
📊 config/swagger.js         ← Configuración OpenAPI
🗂️ routes/                    ← Endpoints
   ├─ usuarios.js
   ├─ productos.js
   ├─ pedidos.js
   └─ status.js
🗂️ scripts/
   └─ create_productos_table.sql
```

---

## 🎯 Próximos Pasos

1. **Explorar Swagger**: http://localhost:3000/api-docs
2. **Importar Postman**: `postman_collection.json`
3. **Leer docs**: `API_DOCUMENTATION.md`
4. **Probar endpoints**: Usar Swagger o Postman
5. **Extender**: Agregar más recursos/validaciones

---

## 💡 Tips

```bash
# Ver logs
tail -f logs/log.txt

# Resetear BD
npm run db:setup

# Generar datos de prueba
npm run db:seed

# Seedear pedidos
npm run db:pedidos
```

---

## 🔗 URLs Importantes

| URL | Propósito |
|-----|-----------|
| `http://localhost:3000` | API Base |
| `http://localhost:3000/api-docs` | Swagger UI |
| `http://localhost:3000/status` | Health Check |
| `http://localhost:3000/usuarios` | Listar usuarios |
| `http://localhost:3000/productos` | Listar productos |
| `http://localhost:3000/orm/pedidos` | Listar pedidos |

---

## ✅ Checklist Final

- [ ] npm install swagger-ui-express swagger-jsdoc
- [ ] Crear tabla productos
- [ ] npm run dev
- [ ] Acceder a http://localhost:3000/api-docs
- [ ] Probar GET /status
- [ ] Importar postman_collection.json
- [ ] Crear un usuario de prueba
- [ ] Crear un producto de prueba
- [ ] Crear un pedido de prueba
- [ ] Leer API_DOCUMENTATION.md

---

## 📞 Contacto & Soporte

- 📖 Documentación: Ver archivos .md
- 🌐 Swagger: http://localhost:3000/api-docs
- 💻 Código: Ver en `routes/`
- 📦 Postman: Importar `postman_collection.json`

---

**¡API lista para usar! 🚀**

Más información: Consulta `README.md` y `API_DOCUMENTATION.md`
