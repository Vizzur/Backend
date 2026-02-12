# Backend - Servidor Express

Servidor backend desarrollado con Node.js y Express, incluye rutas públicas, contenido estático y vistas dinámicas.

## Características

**Rutas Públicas:**
- `GET /` - Página principal (vista dinámica con EJS)
- `GET /status` - Estado del servidor (respuesta JSON)

**Contenido Estático:**
- Archivos CSS, HTML en la carpeta `/public`
- Middleware `express.static()` correctamente configurado

**Motor de Plantillas:**
- Implementado **EJS** para vistas dinámicas
- Carpeta `/views` con plantillas reutilizables

**Sistema de Logging:**
- Registra acceso a rutas en archivo `logs/log.txt`
- Usa `fs.appendFile()` para agregar líneas
- Estructura: fecha, hora, ruta, método HTTP, IP del cliente

## Estructura del Proyecto

```
/home/vizur/Projects/Backend/
├── index.js                    # Archivo principal del servidor
├── package.json                # Dependencias y scripts
├── routes/
│   ├── main.js                # Ruta GET / (vista dinámica)
│   ├── status.js              # Ruta GET /status (JSON)
│   └── test.js                # Endpoints de testing
├── views/
│   └── index.ejs              # Plantilla EJS para home
├── middlewares/
│   └── logger.js              # Middleware de logging con fs.appendFile()
├── public/                     # Archivos estáticos
│   ├── styles.css             # Estilos CSS
│   └── style-guide.html       # Página HTML estática
├── logs/
│   └── log.txt                # Archivo de registro de accesos
├── controllers/               # (Reservado para lógica)
└── node_modules/              # Dependencias instaladas
```

## Instalación

```bash
npm install
```

Las dependencias ya están especificadas en `package.json`:
- `express` - Framework web
- `ejs` - Motor de plantillas
- `dotenv` - Variables de entorno
- `nodemon` - Desarrollo con auto-reload

## Ejecución

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` (por defecto).

## Rutas Disponibles

### Rutas Dinámicas (EJS)

#### 1. GET `/` - Página Principal
- **Tipo de respuesta:** HTML (vista dinámica con EJS)
- **Descrición:** Renderiza la plantilla `views/index.ejs` con datos dinámicos y lista todas las rutas disponibles
- **Datos enviados:** 
  - `titulo` - Título de la página
  - `mensaje` - Mensaje de bienvenida
  - `timestamp` - Fecha/hora de generación

### Rutas API (JSON)

#### 2. GET `/status` - Estado del Servidor
- **Tipo de respuesta:** JSON
- **Descrición:** Retorna información del servidor en tiempo real
- **Datos retornados:**
  ```json
  {
    "estado": "en línea",
    "timestamp": "2026-02-11T10:30:00.000Z",
    "uptime": "245 segundos",
    "memoria": {
      "usado": "45 MB",
      "total": "512 MB"
    },
    "version": "v18.0.0"
  }
  ```

### Rutas de Testing

#### 3. GET `/test` - Información de Testing
- **Tipo de respuesta:** JSON
- **Descrición:** Proporciona información sobre endpoints de testing disponibles

#### 4. GET `/test/log-accesos` - Simular Accesos
- **Tipo de respuesta:** JSON
- **Descrición:** Simula 3 accesos diferentes y los registra automáticamente en `logs/log.txt`
- **Ejemplo de respuesta:**
  ```json
  {
    "mensaje": "Se han registrado 3 accesos simulados en logs/log.txt",
    "accesos": [
      { "ruta": "/", "metodo": "GET", "ip": "192.168.1.100" },
      { "ruta": "/status", "metodo": "GET", "ip": "192.168.1.101" },
      { "ruta": "/style-guide.html", "metodo": "GET", "ip": "192.168.1.102" }
    ]
  }
  ```

### Recursos Estáticos

#### 5. GET `/styles.css` - Hoja de Estilos
- **Tipo de respuesta:** CSS
- **Descrición:** Estilos compartidos para todas las páginas

#### 6. GET `/style-guide.html` - Página de Guía de Estilos
- **Tipo de respuesta:** HTML
- **Descrición:** Página HTML estática con documentación sobre la estructura del proyecto

## Justificación de Decisiones

### ¿Por qué se usa EJS en lugar de solo /public?

Se decidió implementar **EJS como motor de plantillas** para:

1. **Contenido Dinámico:** La ruta `/` genera contenido dinámico con timestamp, datos del servidor, etc.
2. **Reutilización:** Las plantillas pueden reutilizar componentes comunes (headers, footers, layouts)
3. **Escalabilidad:** Facilita la expansión futura con más datos dinámicos
4. **Separación de Responsabilidades:** Las vistas están separadas de la lógica
5. **Mejor Experiencia:** Permite datos personalizados sin recargar la página desde cliente

### Uso de /public

La carpeta `/public` se utiliza para:
- Archivos CSS compartidos (`styles.css`)
- Archivos HTML estáticos puros (`style-guide.html`)
- Imágenes, fuentes y otros recursos estáticos futuros

### Middleware express.static()

```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

Este middleware:
- Sirve archivos desde `/public` sin necesidad de rutas explícitas
- Prioriza los archivos estáticos antes de las rutas dinámicas
- Optimiza el rendimiento para contenido que no cambia

## Variables de Entorno

```env
PORT=3000
NODE_ENV=development
```

## Testing de Rutas

```bash
# Página principal (HTML dinámico)
curl http://localhost:3000/

# Estado del servidor (JSON)
curl http://localhost:3000/status

# Archivo estático CSS
curl http://localhost:3000/styles.css

# Archivo HTML estático
curl http://localhost:3000/style-guide.html

# Simular 3 accesos y registrar en log.txt
curl http://localhost:3000/test/log-accesos
```

## Sistema de Logging (logs/log.txt)

### Descripción

El servidor registra automáticamente todos los accesos a rutas en el archivo `logs/log.txt` usando `fs.appendFile()`. Cada línea de log tiene la siguiente estructura:

```
[YYYY-MM-DD] [HH:MM:SS] METHOD RUTA - IP: x.x.x.x - Status: XXX
```

### Ejemplo de Fichero de Log

```
[2026-02-11] [15:30:45] GET / - IP: 192.168.1.100 - Status: 200
[2026-02-11] [15:30:46] GET /status - IP: 192.168.1.101 - Status: 200
[2026-02-11] [15:30:47] GET /style-guide.html - IP: 192.168.1.102 - Status: 200
[2026-02-11] [15:30:48] GET /styles.css - IP: 192.168.1.100 - Status: 200
[2026-02-11] [15:30:49] GET /test - IP: 192.168.1.103 - Status: 200
[2026-02-11] [15:30:50] GET /test/log-accesos - IP: 192.168.1.104 - Status: 200
```

### Módulo logger.js (middlewares/logger.js)

El módulo proporciona dos funciones principales:

1. **`logAccess(route, method, ip, statusCode)`** - Registra un acceso específico
   - Append línea al archivo `logs/log.txt` usando `fs.appendFile()`
   - Parámetros: ruta, método HTTP, IP del cliente, código de estado
   - No es bloqueante (asincrónico)

2. **`loggerMiddleware(req, res, next)`** - Middleware de Express
   - Se ejecuta en cada solicitud HTTP
   - Captura automáticamente: ruta, método, IP
   - Registra el estado después de que se envíe la respuesta
   - Se integra fácilmente: `app.use(loggerMiddleware)`

### Justificación: ¿Qué se Registra?

Se decidió registrar **acceso a todas las rutas** en lugar de solo errores porque:

1. **Auditoria Completa:** Permite rastrear quién accede a qué y cuándo
2. **Debugging:** Facilita diagnosticar problemas viendo el flujo de solicitudes
3. **Análisis:** Datos útiles para analytics y estadísticas de uso
4. **Seguridad:** Detectar accesos no autorizados o patrones sospechosos
5. **Disponibilidad:** Verificar registro incluso en accesos exitosos (200)

### Simular 3 Accesos Registrados

Para ver los 3 primeros accesos registrados, ejecuta:

```bash
# Inicia el servidor
npm run dev

# En otra terminal, realiza la solicitud:
curl http://localhost:3000/test/log-accesos

# Verifica el contenido del archivo
cat logs/log.txt
```

Verás algo como:
```
[2026-02-11] [15:30:45] GET / - IP: 192.168.1.100 - Status: 200
[2026-02-11] [15:30:46] GET /status - IP: 192.168.1.101 - Status: 200
[2026-02-11] [15:30:47] GET /style-guide.html - IP: 192.168.1.102 - Status: 200
```

## Dependencias

- **express@^5.2.1** - Framework web
- **ejs@^4.0.1** - Motor de plantillas
- **dotenv@^17.2.4** - Gestión de variables de entorno
- **nodemon@^3.1.11** - Desarrollo (auto-reload)

## Próximas Mejoras

- [ ] Agregar más rutas y controladores
- [ ] Implementar autenticación
- [ ] Base de datos
- [ ] Logging avanzado
- [ ] Tests unitarios
- [ ] Validación de datos

## Autor

Felipe Varas

## Licencia

ISC
