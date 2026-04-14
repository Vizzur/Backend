# 🔐 Quick Start - Autenticación JWT

## 30 segundos para empezar

### 1. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}'
```

Obtendrás algo como:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {"id": 1, "nombre": "Juan Pérez"}
}
```

### 2. Usa el token en rutas protegidas

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/usuarios
```

---

## 🎯 Opciones de Prueba

### Opción 1: Swagger (La más fácil)
1. Abre http://localhost:3000/api-docs
2. Busca "auth" 
3. Click "Try it out" en POST /auth/login
4. Ingresa email y contraseña
5. Copia el token
6. Click en "Authorize" (esquina derecha) y pega: `Bearer <token>`
7. Ahora todas las rutas protegidas funcionarán

### Opción 2: Demo HTML (Interfaz Visual)
Abre en tu navegador:
```
http://localhost:3000/auth-demo.html
```

Interfaz completa para:
- Login
- Ver token
- Obtener perfil
- Listar usuarios y productos
- Renovar token
- Logout

### Opción 3: Script Bash (Automatizado)
```bash
./test-auth.sh
```

Ejecuta todos los tests de autenticación automáticamente.

### Opción 4: JavaScript Fetch (Para Frontend)
Ver `ejemplos-auth.js` con ejemplos completos de:
- Login
- Peticiones autenticadas
- Renovación de token
- Logout

---

## 📚 Rutas de Autenticación

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/auth/login` | ❌ No | Obtener token JWT |
| POST | `/auth/verificar` | ❌ No | Verificar si un token es válido |
| GET | `/auth/perfil` | ✅ Sí | Obtener perfil del usuario autenticado |
| POST | `/auth/refresh` | ✅ Sí | Renovar token |
| POST | `/auth/logout` | ✅ Sí | Hacer logout |

---

## 🔒 Rutas Protegidas Actuales

Estas rutas requieren token en header `Authorization: Bearer <token>`:

```
GET  /usuarios           → Listar usuarios
GET  /usuarios/:id       → Obtener usuario por ID
GET  /productos          → Listar productos
GET  /productos/:id      → Obtener producto por ID
```

Sin token → Error 401 Unauthorized

---

## 🔑 Credenciales de Prueba

```
Email: juan@example.com
Password: password123
```

---

## 💻 Ejemplos de Código

### JavaScript Fetch
```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'juan@example.com',
    password: 'password123'
  })
});

const {token} = await loginResponse.json();
localStorage.setItem('authToken', token);

// 2. Usar token en petición protegida
const usuariosResponse = await fetch('http://localhost:3000/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const usuarios = await usuariosResponse.json();
console.log(usuarios);
```

### Python Requests
```python
import requests

# 1. Login
login_response = requests.post('http://localhost:3000/auth/login', json={
    'email': 'juan@example.com',
    'password': 'password123'
})

token = login_response.json()['token']

# 2. Usar token
headers = {'Authorization': f'Bearer {token}'}
usuarios = requests.get('http://localhost:3000/usuarios', headers=headers)
print(usuarios.json())
```

### Node.js Axios
```javascript
const axios = require('axios');

// 1. Login
const loginRes = await axios.post('http://localhost:3000/auth/login', {
  email: 'juan@example.com',
  password: 'password123'
});

const token = loginRes.data.token;

// 2. Usar token
const usuarios = await axios.get('http://localhost:3000/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

console.log(usuarios.data);
```

---

## 📊 Estructura del Token

El token retornado es un JWT con estructura:
```
HEADER.PAYLOAD.SIGNATURE
```

### Decodificado (sin validar firma):
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 1,
    "email": "juan@example.com",
    "nombre": "Juan Pérez",
    "rol": "usuario",
    "iat": 1712320000,
    "exp": 1712406400
  }
}
```

**Expiración:** 24 horas (86400 segundos)

---

## ❌ Errores Comunes

### 401 - No hay token
```json
{"error": "No autorizado", "message": "Se requiere un token"}
```
**Solución:** Agrega header `Authorization: Bearer <token>`

### 401 - Token expirado
```json
{"error": "Token inválido", "message": "Token expirado"}
```
**Solución:** Usa `POST /auth/refresh` o haz login nuevamente

### 401 - Credenciales incorrectas
```json
{"error": "Credenciales inválidas"}
```
**Solución:** Verifica email y contraseña

### 403 - Usuario inactivo
```json
{"error": "Usuario inactivo"}
```
**Solución:** Contacta al administrador

---

## 🔄 Renovar Token

Si el token estásiendo cercano a expirar:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Respuesta: Nuevo token válido por otras 24 horas

---

## 🧪 Probar Todo de una Vez

### Script Bash completo:
```bash
#!/bin/bash

# 1. Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}' \
  | jq -r '.token')

echo "✅ Token: ${TOKEN:0:50}..."

# 2. Obtener usuarios con token
echo ""
echo "📋 Usuarios:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/usuarios | jq '.data[0:2]'

# 3. Sin token (debe fallar)
echo ""
echo "❌ Sin token (esperado error 401):"
curl -s http://localhost:3000/usuarios | jq '.message'
```

---

## 📂 Archivos Relacionados

- **AUTH.md** - Documentación completa
- **test-auth.sh** - Script bash con todos los tests
- **ejemplos-auth.js** - Ejemplos JavaScript con Fetch API
- **public/auth-demo.html** - Demo interactivo en navegador
- **config/auth.js** - Configuración JWT
- **middlewares/auth.js** - Middleware de protección
- **controllers/AuthController.js** - Lógica de autenticación
- **routes/auth.js** - Endpoints de autenticación

---

## 🚀 Próximos Pasos

1. **Implementar bcrypt** para hash de contraseñas (ahora es plain text)
2. **Token blacklist** para logout real
3. **Refresh tokens** (tokens cortos y largos)
4. **2FA** (autenticación de dos factores)
5. **OAuth2/Google Sign-in**

---

## 📞 Necesitas Ayuda?

Lee **AUTH.md** para documentación completa.
