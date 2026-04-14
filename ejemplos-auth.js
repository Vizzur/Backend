/**
 * 🔐 Ejemplos de Uso - Autenticación JWT
 * 
 * Este archivo contiene ejemplos de cómo usar la autenticación JWT
 * en una aplicación JavaScript (Frontend o Node.js)
 */

// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_URL = 'http://localhost:3000';

// Guardar token en localStorage
function guardarToken(token) {
  localStorage.setItem('authToken', token);
}

// Obtener token de localStorage
function obtenerToken() {
  return localStorage.getItem('authToken');
}

// Limpiar token
function limpiarToken() {
  localStorage.removeItem('authToken');
}

// ============================================================
// 1. LOGIN - Obtener JWT
// ============================================================

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token
      guardarToken(data.token);
      console.log('✅ Login exitoso');
      console.log('Token:', data.token);
      console.log('Usuario:', data.usuario);
      return data;
    } else {
      console.error('❌ Error en login:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
await login('juan@example.com', 'password123');
// ✅ Login exitoso
// Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// Usuario: { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com' }
*/

// ============================================================
// 2. HACER PETICIONES AUTENTICADAS
// ============================================================

async function peticionAutenticada(endpoint, opciones = {}) {
  const token = obtenerToken();

  if (!token) {
    throw new Error('No hay token. Por favor hacer login primero.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...opciones.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...opciones,
      headers
    });

    const data = await response.json();

    if (response.status === 401) {
      // Token expirado o inválido
      console.warn('⚠️ Token inválido o expirado');
      limpiarToken();
      throw new Error('Token expirado. Por favor login nuevamente.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Error en petición');
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
const usuarios = await peticionAutenticada('/usuarios?page=1&limit=10');
console.log(usuarios);
*/

// ============================================================
// 3. OBTENER PERFIL DEL USUARIO AUTENTICADO
// ============================================================

async function obtenerPerfil() {
  try {
    const data = await peticionAutenticada('/auth/perfil');
    console.log('✅ Perfil obtenido:', data.usuario);
    return data.usuario;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
const miPerfil = await obtenerPerfil();
console.log(miPerfil);
// ✅ Perfil obtenido: { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', ... }
*/

// ============================================================
// 4. RENOVAR TOKEN
// ============================================================

async function renovarToken() {
  try {
    const data = await peticionAutenticada('/auth/refresh', {
      method: 'POST'
    });

    guardarToken(data.token);
    console.log('✅ Token renovado');
    return data.token;
  } catch (error) {
    console.error('Error al renovar token:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
await renovarToken();
// ✅ Token renovado
*/

// ============================================================
// 5. VERIFICAR SI EL TOKEN ES VÁLIDO
// ============================================================

async function verificarToken() {
  const token = obtenerToken();

  if (!token) {
    console.log('❌ No hay token');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/verificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Token válido');
      return true;
    } else {
      console.log('❌ Token inválido:', data.message);
      limpiarToken();
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Ejemplo de uso:
/*
const esValido = await verificarToken();
if (esValido) {
  console.log('Token aún válido');
} else {
  console.log('Token expirado, necesita login nuevamente');
}
*/

// ============================================================
// 6. LOGOUT
// ============================================================

async function logout() {
  try {
    const data = await peticionAutenticada('/auth/logout', {
      method: 'POST'
    });
    console.log('✅ Logout exitoso');
    limpiarToken();
    return true;
  } catch (error) {
    console.error('Error al hacer logout:', error);
    limpiarToken();
    return false;
  }
}

// Ejemplo de uso:
/*
await logout();
// ✅ Logout exitoso
// Token eliminado de localStorage
*/

// ============================================================
// 7. OBTENER USUARIOS (RUTA PROTEGIDA)
// ============================================================

async function obtenerUsuarios(page = 1, limit = 10) {
  try {
    const data = await peticionAutenticada(`/usuarios?page=${page}&limit=${limit}`);
    console.log('✅ Usuarios obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
const usuarios = await obtenerUsuarios(1, 10);
usuarios.data.forEach(u => {
  console.log(`${u.nombre} (${u.email})`);
});
*/

// ============================================================
// 8. OBTENER UN USUARIO POR ID (RUTA PROTEGIDA)
// ============================================================

async function obtenerUsuario(id) {
  try {
    const data = await peticionAutenticada(`/usuarios/${id}`);
    console.log('✅ Usuario obtenido:', data.usuario);
    return data.usuario;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
const usuario = await obtenerUsuario(1);
console.log(usuario);
*/

// ============================================================
// 9. OBTENER PRODUCTOS (RUTA PROTEGIDA)
// ============================================================

async function obtenerProductos(page = 1, limit = 10) {
  try {
    const data = await peticionAutenticada(`/productos?page=${page}&limit=${limit}`);
    console.log('✅ Productos obtenidos');
    return data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
const productos = await obtenerProductos(1, 10);
productos.data.forEach(p => {
  console.log(`${p.nombre}: $${p.precio}`);
});
*/

// ============================================================
// 10. FLUJO COMPLETO - EJEMPLO
// ============================================================

async function ejemploFlujoCompleto() {
  console.log('🔐 Iniciando flujo de autenticación...\n');

  try {
    // 1. LOGIN
    console.log('1️⃣  Haciendo login...');
    await login('juan@example.com', 'password123');

    // 2. OBTENER PERFIL
    console.log('\n2️⃣  Obteniendo perfil...');
    const perfil = await obtenerPerfil();

    // 3. OBTENER USUARIOS
    console.log('\n3️⃣  Obteniendo usuarios...');
    const usuarios = await obtenerUsuarios(1, 5);
    console.log(`Se obtuvieron ${usuarios.data.length} usuarios`);

    // 4. VERIFICAR TOKEN
    console.log('\n4️⃣  Verificando token...');
    const esValido = await verificarToken();

    // 5. RENOVAR TOKEN
    console.log('\n5️⃣  Renovando token...');
    await renovarToken();

    // 6. LOGOUT
    console.log('\n6️⃣  Haciendo logout...');
    await logout();

    console.log('\n✅ Flujo completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar:
// ejemploFlujoCompleto();

// ============================================================
// 11. AUTO-RENOVACIÓN DE TOKEN
// ============================================================

class AuthManager {
  constructor(tiempoRenovacion = 23 * 60 * 60 * 1000) { // 23 horas
    this.tiempoRenovacion = tiempoRenovacion;
    this.intervaloRenovacion = null;
  }

  iniciarRenovacionAutomatica() {
    this.intervaloRenovacion = setInterval(async () => {
      try {
        console.log('🔄 Renovando token automáticamente...');
        await renovarToken();
      } catch (error) {
        console.error('Error al renovar token automáticamente:', error);
      }
    }, this.tiempoRenovacion);

    console.log('✅ Renovación automática de token activada');
  }

  detenerRenovacionAutomatica() {
    if (this.intervaloRenovacion) {
      clearInterval(this.intervaloRenovacion);
      console.log('⛔ Renovación automática desactivada');
    }
  }
}

// Ejemplo de uso:
/*
const authManager = new AuthManager();
authManager.iniciarRenovacionAutomatica();

// Cuando el usuario hace logout:
authManager.detenerRenovacionAutomatica();
*/

// ============================================================
// 12. INTERCEPTOR DE PETICIONES (AXIOS-LIKE)
// ============================================================

class APIClient {
  constructor(baseURL, tokenGetter = obtenerToken) {
    this.baseURL = baseURL;
    this.tokenGetter = tokenGetter;
  }

  async request(endpoint, opciones = {}) {
    const token = this.tokenGetter();

    const headers = {
      'Content-Type': 'application/json',
      ...opciones.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...opciones,
        headers
      });

      const data = await response.json();

      if (response.status === 401) {
        limpiarToken();
        console.warn('⚠️ Sesión expirada. Por favor haga login nuevamente.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error en petición');
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Ejemplo de uso:
/*
const api = new APIClient(API_URL);

// GET
const usuarios = await api.get('/usuarios');

// POST
const nuevoUsuario = await api.post('/usuarios', { nombre: 'Nuevo' });

// PUT
const actualizado = await api.put('/usuarios/1', { nombre: 'Actualizado' });

// DELETE
await api.delete('/usuarios/1');
*/

// ============================================================
// EXPORTAR FUNCIONES
// ============================================================

// Si usas este archivo como módulo:
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    login,
    logout,
    peticionAutenticada,
    obtenerPerfil,
    renovarToken,
    verificarToken,
    obtenerUsuarios,
    obtenerUsuario,
    obtenerProductos,
    guardarToken,
    obtenerToken,
    limpiarToken,
    AuthManager,
    APIClient,
    ejemploFlujoCompleto
  };
}
