# Backend Genesis

Backend de Genesis, la aplicación que genera código híbrido a partir de **diagramas** o **descripciones textuales** usando modelos de IA locales con Ollama.

## 📑 Índice

- [🚀 Inicio Rápido](#-inicio-rápido)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🧠 Arquitectura de dos capas](#-arquitectura-de-dos-capas)
- [⚙️ Qué hace cada módulo](#️-qué-hace-cada-módulo)
- [📋 Requisitos Previos](#-requisitos-previos)
- [🔐 Configuración de Variables de Entorno](#-configuración-de-variables-de-entorno)
- [🚀 Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [🔐 Sistema de Autenticación JWT](#-sistema-de-autenticación-jwt)
- [💾 Base de Datos PostgreSQL](#-base-de-datos-postgresql)
- [🧪 Endpoints Disponibles](#-endpoints-disponibles)
- [🧰 Estructura de Respuesta de Ollama](#-estructura-de-respuesta-de-ollama)
- [🔄 Flujo de Ejecución](#-flujo-de-ejecución)
- [🛠️ Solución de Problemas Comunes](#️-solución-de-problemas-comunes)
- [📚 Recursos](#-recursos)
- [📊 Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [📄 Licencia](#-licencia)
- [📧 Contacto](#-contacto)

---

## 🚀 Inicio Rápido

### Arquitectura del Backend

El backend está dividido en dos capas:
- **Node.js API Gateway** (Puerto 3000): Punto de entrada para el frontend, maneja autenticación y orquestación
- **FastAPI** (Puerto 8001): Procesamiento de IA y comunicación con Ollama

```bash
# Terminal 1: Iniciar Ollama
ollama serve

# Terminal 2: Iniciar servidor FastAPI
cd backend/llmapi
./setup.sh  # Solo la primera vez
./run.sh

# Terminal 3: Iniciar API Gateway de Node.js
cd backend
npm install  # Solo la primera vez
npm run dev
```

Los servidores estarán disponibles en:
- **Node.js API Gateway**: http://localhost:3000
- **FastAPI**: http://localhost:8001
- **API Docs (FastAPI)**: http://localhost:8001/docs
- **ReDoc (FastAPI)**: http://localhost:8001/redoc

---

## 📂 Estructura del proyecto

```
backend/
├── src/                          # API Gateway (Express + Node.js)
│   ├── server.js                # Punto de entrada del servidor Express
│   ├── config/
│   │   ├── index.js             # Configuración centralizada
│   │   └── database.js          # Pool de conexiones PostgreSQL
│   ├── routes/
│   │   ├── index.js             # Registro de rutas
│   │   ├── auth.routes.js       # Rutas de autenticación
│   │   ├── users.routes.js      # Rutas de usuarios
│   │   ├── chats.routes.js      # Rutas de chats
│   │   ├── messages.routes.js   # Rutas de mensajes
│   │   ├── projects.routes.js   # Rutas de proyectos
│   │   ├── models.routes.js     # Rutas de modelos Ollama
│   │   └── generate.routes.js   # Rutas de generación IA
│   ├── controllers/
│   │   ├── auth.controller.js       # Lógica de autenticación
│   │   ├── users.controller.js      # Lógica de usuarios
│   │   ├── chats.controller.js      # Lógica de chats
│   │   ├── messages.controller.js   # Lógica de mensajes
│   │   ├── projects.controller.js   # Lógica de proyectos
│   │   ├── models.controller.js     # Lógica de modelos
│   │   └── generate.controller.js   # Lógica de generación
│   ├── services/
│   │   ├── auth.service.js      # JWT y bcrypt
│   │   └── ollama.service.js    # Cliente HTTP para FastAPI
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Verificación JWT
│   │   ├── validation.middleware.js # Manejo de validaciones
│   │   ├── validators.js            # Reglas de validación
│   │   └── error.middleware.js      # Manejo de errores
│   ├── db/
│   │   ├── index.js             # Exporta todos los módulos
│   │   ├── users.js             # Operaciones de usuarios
│   │   ├── chats.js             # Operaciones de chats
│   │   ├── messages.js          # Operaciones de mensajes
│   │   ├── message_images.js    # Operaciones de imágenes
│   │   ├── projects.js          # Operaciones de proyectos
│   │   ├── generated_codes.js   # Operaciones de código generado
│   │   ├── schema.sql           # Schema de la base de datos
│   │   └── README.md            # Documentación de BD
│   └── utils/
│       └── logger.js            # Sistema de logging
├── package.json
├── .env
├── .gitignore
├── README.md
├── API_AUTH.md                   # Documentación de autenticación
│
└── llmapi/                       # Backend de IA (FastAPI + Python)
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── routes/
    │   │   ├── generate.py      # Endpoint de generación de código
    │   │   └── models.py        # Endpoint de modelos
    │   ├── services/
    │   │   └── ollama_service.py # Comunicación con Ollama
    │   ├── schemas/
    │   │   └── generate_request.py # Modelos Pydantic
    │   └── core/
    │       ├── config.py        # Variables de entorno
    │       └── logger.py        # Logging
    ├── requirements.txt
    ├── setup.sh
    ├── run.sh
    ├── .env
    └── .venv/
```

---

## 🧠 Arquitectura de dos capas

### 🟢 Node.js API Gateway (Puerto 3000)
Punto de entrada para el frontend. Se encarga de:
- Recibir peticiones del frontend React
- **Autenticación JWT** (Access Token + Refresh Token)
- **Gestión de usuarios** y perfiles
- **Historial de chats** y mensajes persistentes
- **Organización de chats en proyectos**
- Validación inicial y manejo de archivos (hasta 5 imágenes)
- Proxy a FastAPI para procesamiento de IA
- Conexión con **PostgreSQL** para almacenamiento

### 🔵 FastAPI (Puerto 8001)
Backend especializado en IA. Se encarga de:
- Comunicación con **Ollama** (modelos locales de IA)
- **Generación en dos pasos**: Extracción de PlantUML → Generación de código
- Procesamiento de imágenes y conversión a base64
- **Validación de diagramas UML** en imágenes
- Generación de código híbrido con contexto conversacional
- Gestión de modelos y timeouts configurables
- **Streaming con eventos de control** para mostrar progreso paso a paso
- Mantenimiento de historial de mensajes para coherencia en la conversación

---

## 🧠 FastAPI

Se encarga de comunicarse con **Ollama** (modelos locales de IA), procesar imágenes y devolver respuestas estructuradas que posteriormente usará el **API Gateway en Node.js** y el **frontend en React**.

## ⚙️ Qué hace cada módulo

| Archivo | Descripción |
|----------|--------------|
| `main.py` | Punto de entrada del servidor FastAPI. Registra las rutas, configura CORS y eventos de startup/shutdown. |
| `routes/generate.py` | Endpoint `/generate/` que recibe `model`, `prompt` y una `imagen` opcional. Valida entrada (max 10MB), llama a Ollama y devuelve el código generado. |
| `routes/models.py` | Endpoint `/models/` que devuelve la lista de modelos disponibles en Ollama con manejo de errores robusto. |
| `services/ollama_service.py` | Lógica de comunicación con Ollama (`/api/chat`, `/api/tags`). Convierte imágenes a base64 y maneja múltiples formatos de respuesta. |
| `schemas/generate_request.py` | Modelos Pydantic para validación de datos: `GenerateRequest`, `GenerateResponse`, `ModelInfo`, `ModelsResponse`. |
| `core/config.py` | Carga variables de entorno, configura URLs de Ollama y CORS con soporte para múltiples orígenes. |
| `core/logger.py` | Sistema de logging configurable con niveles y formato mejorado. |
| `requirements.txt` | Dependencias de Python necesarias. |

---

## 📋 Requisitos Previos

1. **Python 3.10+**
2. **Pip** actualizado: `python -m pip install --upgrade pip`
3. **Node.js 18+** y **npm**
4. **PostgreSQL 14+** instalado y ejecutándose
   - Base de datos `tfg_app` creada
   - Schema cargado desde `backend/src/db/schema.sql`
5. **Ollama** instalado y ejecutándose localmente
   - 👉 [Descargar Ollama](https://ollama.ai)
   - Verificar instalación: `ollama --version`
6. **Al menos un modelo descargado** (ej: `ollama pull qwen2.5-coder:14b`)

## 🔐 Configuración de Variables de Entorno

### Node.js API Gateway (.env en la raíz)

Crea un archivo `.env` en la carpeta raíz de `backend/`:

```env
# FastAPI Backend
FASTAPI_URL=http://localhost:8001

# Server Configuration
PORT=3000
NODE_ENV=development

# Request Configuration
REQUEST_TIMEOUT=600000  # 10 minutos en ms (para modelos grandes)
MAX_FILE_SIZE=10485760  # 10MB en bytes

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tfg_app
DB_USER=postgres
DB_PASSWORD=tu_password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

### FastAPI Backend (.env en llmapi/)

Crea un archivo `.env` en la carpeta `llmapi/`:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Timeout Configuration (in seconds)
# For large models (27B+), increase OLLAMA_TIMEOUT to 600-900 seconds
OLLAMA_TIMEOUT=600
OLLAMA_TAGS_TIMEOUT=30

# Server Configuration
HOST=0.0.0.0
PORT=8001

# CORS Configuration (comma-separated list)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

### ⚙️ Configuración de Timeouts

- **REQUEST_TIMEOUT** (Node.js): Tiempo máximo en milisegundos para requests HTTP
- **OLLAMA_TIMEOUT** (FastAPI): Tiempo máximo de espera para generación de código
  - Modelos pequeños (7B): 60-120 segundos
  - Modelos medianos (13B): 120-300 segundos
  - Modelos grandes (27B+): 600-900 segundos
  
- **OLLAMA_TAGS_TIMEOUT** (FastAPI): Tiempo de espera para listar modelos (default: 30s)

**Nota:** Los scripts de setup crean automáticamente estos archivos si no existen.

---

## 🚀 Instalación y Ejecución Local

### 📦 Instalación completa (ambos servicios)

```bash
# 1. Instalar y configurar FastAPI
cd backend/llmapi
./setup.sh  # Crea .venv, instala dependencias, crea .env
cd ../..

# 2. Instalar y configurar Node.js
cd backend
npm install  # Instala todas las dependencias
```

### ▶️ Ejecución completa

```bash
# Terminal 1: Iniciar Ollama (debe estar corriendo siempre)
ollama serve

# Terminal 2: Iniciar FastAPI
cd backend/llmapi
./run.sh

# Terminal 3: Iniciar Node.js API Gateway
cd backend
npm run dev
```

### 🔵 FastAPI - Instalación Manual

#### 1️⃣ Navegar a la carpeta

```bash
cd backend/llmapi
```

#### 2️⃣ Crear entorno virtual

```bash
python -m venv .venv
```

#### 3️⃣ Activar el entorno

**macOS / Linux:**
```bash
source .venv/bin/activate
```

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

#### 4️⃣ Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 5️⃣ Crear archivo `.env`

Copia el ejemplo de la sección anterior.

### Ejecución de FastAPI

**Opción A: Script automático**
```bash
./run.sh
```

**Opción B: Manual**
```bash
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🔐 Sistema de Autenticación JWT

El backend implementa un sistema completo de autenticación con **JSON Web Tokens (JWT)** que incluye:

### ✨ Características

- ✅ Registro e inicio de sesión de usuarios
- ✅ **Access Token** y **Refresh Token**
- ✅ Protección de rutas con middleware de autenticación
- ✅ Gestión de perfil de usuario (username, email, avatar)
- ✅ Cambio seguro de contraseña (requiere contraseña actual)
- ✅ Contraseñas hasheadas con **bcrypt** (10 salt rounds)
- ✅ Validación robusta con **express-validator**

### 🔑 Endpoints de Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registro de nuevo usuario | ❌ |
| POST | `/api/auth/login` | Inicio de sesión | ❌ |
| POST | `/api/auth/refresh` | Renovar tokens | ❌ |
| GET | `/api/auth/profile` | Obtener perfil del usuario | ✅ |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ |
| PUT | `/api/users/me` | Actualizar datos de usuario | ✅ |
| PUT | `/api/users/me/password` | Cambiar contraseña | ✅ |
| DELETE | `/api/users/me` | Eliminar cuenta | ✅ |

### 📝 Ejemplo de Uso

**Registro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "Password123"
  }'
```

**Usar token en requests:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <tu_access_token>"
```

### 🔒 Flujo de Autenticación

1. **Login/Registro** → Recibe `accessToken` y `refreshToken`
2. **Requests autenticados** → Incluir header: `Authorization: Bearer <accessToken>`
3. **Token expirado** → Usar `/api/auth/refresh` con `refreshToken`
4. **Recibir nuevos tokens** → Continuar usando el servicio

### 🛡️ Validaciones

**Username:**
- 3-50 caracteres

**Email:**
- Formato válido
- Único en el sistema

**Password:**
- Mínimo 6 caracteres
- Debe contener: mayúscula, minúscula y número

---

## 💾 Base de Datos PostgreSQL

El sistema utiliza **PostgreSQL** para persistir toda la información de usuarios, chats, mensajes y código generado.

### 📋 Schema Principal

```sql
users
├── id (PRIMARY KEY)
├── username (VARCHAR 50)
├── email (UNIQUE, VARCHAR 100)
├── password_hash (VARCHAR 255)
├── avatar_url (TEXT)
├── created_at
└── updated_at

projects
├── id (PRIMARY KEY)
├── user_id (FK → users, CASCADE)
├── name (VARCHAR 255)
├── is_expanded (BOOLEAN, default TRUE)
├── created_at
└── updated_at

chats
├── id (PRIMARY KEY)
├── user_id (FK → users, CASCADE)
├── project_id (FK → projects, SET NULL)
├── title (VARCHAR 255, default 'Nuevo Chat')
├── pinned (BOOLEAN, default FALSE)
├── created_at
└── updated_at

messages
├── id (PRIMARY KEY)
├── chat_id (FK → chats, CASCADE)
├── role (user/assistant)
├── content (TEXT)
├── is_error (BOOLEAN, default FALSE)
├── is_collapsible (BOOLEAN, default FALSE)
└── created_at

message_images
├── id (PRIMARY KEY)
├── message_id (FK → messages, CASCADE)
├── original_filename (VARCHAR 255)
├── image_data (TEXT, base64)
├── mime_type (VARCHAR 50)
├── file_size (INTEGER)
├── image_order (1-5)
└── created_at
```

**Notas importantes:**
- Las relaciones usan `ON DELETE CASCADE` para eliminar datos relacionados automáticamente
- Los proyectos permiten organizar chats en carpetas expandibles
- `project_id` en chats usa `ON DELETE SET NULL` para que los chats se mantengan al eliminar un proyecto
- `image_order` permite hasta 5 imágenes por mensaje
- `image_data` almacena las imágenes en formato base64
- `pinned` permite marcar chats como favoritos (solo disponible para chats sin proyecto)
- `is_error` y `is_collapsible` controlan la visualización de mensajes especiales

---

---

## 🧪 Endpoints disponibles

### 🌐 Node.js API Gateway (Puerto 3000)

Todos los endpoints del frontend deben apuntar a `http://localhost:3000/api`

> 🔒 **Nota:** Los endpoints marcados con 🔒 requieren autenticación. Incluye el header:  
> `Authorization: Bearer <tu_access_token>`

---

### 🔐 Autenticación y Usuarios

#### POST /api/auth/register
Registro de nuevo usuario.

#### POST /api/auth/login
Inicio de sesión y obtención de tokens.

#### POST /api/auth/refresh
Renovación de tokens (access + refresh).

#### GET /api/auth/profile 🔒
Obtener perfil del usuario autenticado.

#### POST /api/auth/logout 🔒
Cerrar sesión del usuario autenticado.

#### PUT /api/users/me 🔒
Actualizar datos del usuario (username, email, avatar).

#### PUT /api/users/me/password 🔒
Cambiar contraseña del usuario.

#### DELETE /api/users/me 🔒
Eliminar cuenta del usuario.

---

### 💬 Chats y Mensajes

#### GET /api/chats 🔒
Obtener todos los chats del usuario autenticado.

#### POST /api/chats 🔒
Crear un nuevo chat.

#### GET /api/chats/:chatId 🔒
Obtener detalles de un chat específico.

#### PUT /api/chats/:chatId 🔒
Actualizar título de un chat.

#### DELETE /api/chats/:chatId 🔒
Eliminar un chat y todos sus mensajes.

#### GET /api/chats/:chatId/messages 🔒
Obtener todos los mensajes de un chat.

#### POST /api/messages 🔒
Crear un nuevo mensaje en un chat.

---

### 📁 Proyectos

#### GET /api/projects 🔒
Obtener todos los proyectos del usuario autenticado con sus chats.

#### POST /api/projects 🔒
Crear un nuevo proyecto.

#### PUT /api/projects/:projectId 🔒
Actualizar el nombre de un proyecto.

#### PATCH /api/projects/:projectId/toggle-expand 🔒
Alternar estado expandido/colapsado de un proyecto.

#### DELETE /api/projects/:projectId 🔒
Eliminar un proyecto. Los chats asociados permanecen pero vuelven a la lista general.

#### POST /api/projects/add-chat 🔒
Agregar un chat existente a un proyecto.

#### DELETE /api/projects/remove-chat/:chatId 🔒
Quitar un chat de su proyecto actual.

---

### 🤖 Generación de Código (Ollama)

#### 🟢 GET /api/models

**Descripción:** Obtiene la lista de modelos disponibles en Ollama

**Request:**
```bash
curl http://localhost:3000/api/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "gemma3:27b",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 27000000000
    }
  ]
}
```

#### 🟢 POST /api/generate

**Descripción:** Genera código a partir de texto o imágenes. Soporta hasta 5 imágenes simultáneas.

**Request con texto:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -F "model=qwen2.5-coder:14b" \
  -F "prompt=Crea un hola mundo en python"
```

**Request con múltiples imágenes:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -F "model=qwen3-vl:8b" \
  -F "prompt=Analiza estos diagramas y genera el código" \
  -F "images=@./diagram1.png" \
  -F "images=@./diagram2.png" \
  -F "images=@./diagram3.png"
```

**Response:**
```json
{
  "model": "gemma3:27b",
  "content": "public class User { ... }"
}
```

#### 🟢 POST /api/generate/stream

**Descripción:** Genera código con streaming (respuesta progresiva en tiempo real). Soporta contexto de conversación para mantener coherencia entre mensajes y hasta 5 imágenes simultáneas.

**Modo Automático con Imágenes:**
Cuando se usa el modelo automático (`Auto`) con imágenes, el sistema ejecuta un proceso de dos pasos:
1. **Extracción de PlantUML** usando `qwen3-vl:8b` - Convierte diagramas UML en código PlantUML
2. **Generación de código** usando `qwen2.5-coder:14b` - Genera código a partir del PlantUML

Si todas las imágenes se detectan como no-UML, el proceso se detiene y retorna un mensaje de error.

**Parámetros:**
- `model` (string, requerido): Nombre del modelo (usa "Auto" para activar el modo de dos pasos)
- `prompt` (string, requerido): Texto del prompt
- `messages` (string, opcional): Historial de mensajes en formato JSON para mantener contexto
- `images` (files, opcional): Hasta 5 imágenes (máx 10MB cada una)
- `autoMode` (string, opcional): "true" para activar el proceso de dos pasos

**Request básico:**
```bash
curl -X POST http://localhost:3000/api/generate/stream \
  -F "model=qwen2.5-coder:14b" \
  -F "prompt=Crea un hola mundo en python"
```

**Request con contexto:**
```bash
curl -X POST http://localhost:3000/api/generate/stream \
  -F "model=qwen2.5-coder:14b" \
  -F "prompt=Ahora hazlo en Java" \
  -F 'messages=[{"role":"user","content":"Crea un hola mundo en python"},{"role":"assistant","content":"def hello_world()..."}]'
```

**Response estándar:** Server-Sent Events (SSE)
```
data: def
data:  hello
data: _world
data: ():
data: \n
data:     print
data: ("
data: Hello
data:  World
data: ")
data: [DONE]
```

**Response en modo automático con imágenes:** Server-Sent Events con eventos de control
```
data: "[STEP1_START]"
data: "```plantuml"
data: "\n@startuml\n"
data: "class User {\n"
data: "  +name: String\n"
data: "}\n"
data: "@enduml\n"
data: "```"
data: "[STEP1_END]"
data: "[STEP2_START]"
data: "class User:\n"
data: "    def __init__(self, name):\n"
data: "        self.name = name\n"
data: [DONE]
```

**Eventos de control:**
- `[STEP1_START]`: Inicia extracción de PlantUML (frontend muestra "Generando PlantUML")
- `[STEP1_END]`: Finaliza extracción de PlantUML
- `[STEP2_START]`: Inicia generación de código final
- `[DONE]`: Proceso completado

**Nota:** El streaming permite mostrar la respuesta en tiempo real a medida que el modelo la genera, mejorando la experiencia de usuario para respuestas largas. En modo automático, el usuario puede ver el PlantUML intermedio de forma expandible.

#### 🟢 POST /api/models/unload

**Descripción:** Descarga un modelo de la memoria

**Request:**
```bash
curl -X POST http://localhost:3000/api/models/unload \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-vl:8b"}'
```

### 🔧 FastAPI (Puerto 8001)

Endpoints directos de FastAPI (normalmente solo usados internamente por el API Gateway)

#### 🟢 GET / - Health Check


**Descripción:** Verifica que el servidor está activo.

**Ejemplo:**
```bash
curl http://localhost:8001/
```

**Respuesta:**
```json
{
  "message": "FastAPI IA service running",
  "status": "ok"
}
```

---

### 🟣 GET /models/ - Listar Modelos

**Descripción:** Devuelve la lista de modelos disponibles en Ollama.

**Ejemplo:**
```bash
curl http://localhost:8001/models/
```

**Respuesta esperada:**
```json
{
  "models": [
    {
      "name": "qwen2-vl:latest",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 4400000000,
      "digest": "sha256:abc123..."
    }
  ]
}
```

**Errores posibles:**
- `503` - Ollama no está corriendo o no responde

---

### 🗑️ POST /models/unload - Descargar Modelo de Memoria

**Descripción:** Descarga un modelo de la memoria RAM/VRAM para liberar recursos del sistema.

**Request Body:**
```json
{
  "model": "qwen2-vl"
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:8001/models/unload" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-vl:8b"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Modelo qwen2-vl descargado de memoria exitosamente",
  "model": "qwen2-vl"
}
```

**Errores posibles:**
- `503` - Ollama no está corriendo o el modelo no existe
- `500` - Error al descargar el modelo

---

### 🔵 POST /generate/ - Generar Código

**Descripción:** Genera código a partir de un prompt y opcionalmente hasta 5 imágenes.

**Parámetros:**
- `model` (string, requerido): Nombre del modelo en Ollama
- `prompt` (string, requerido): Descripción de lo que quieres generar
- `images` (files, opcional): Hasta 5 imágenes del diagrama UML (máx 10MB cada una)

**Ejemplo sin imagen:**
```bash
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen3-vl:8b" \
  -F "prompt=Crea una hola mundo en python"
```

**Ejemplo con múltiples imágenes:**
```bash
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen3-vl:8b" \
  -F "prompt=Analiza los diagramas UML y genera el código correspondiente" \
  -F "images=@/ruta/a/diagrama1.png" \
  -F "images=@/ruta/a/diagrama2.png"
```

**Respuesta esperada:**
```json
{
  "result": "class UserManager:\n    def __init__(self):\n        self.users = []\n    \n    def create_user(self, name, email):\n        ..."
}
```

**Errores posibles:**
- `400` - Imagen demasiado grande (>10MB), más de 5 imágenes, o parámetros inválidos
- `500` - Error en la generación o modelo no disponible
- `503` - Ollama no está corriendo

---

### 🔵 POST /generate/stream - Generar Código con Streaming

**Descripción:** Genera código con streaming usando Server-Sent Events (SSE), mostrando la respuesta en tiempo real a medida que se genera. Soporta contexto de conversación para recordar mensajes anteriores y hasta 5 imágenes simultáneas.

**Modo Automático (auto_mode=true con imágenes):**
- **Paso 1**: Extrae PlantUML usando `qwen3-vl:8b` y envía eventos `[STEP1_START]`/`[STEP1_END]`
- **Validación**: Si todas las imágenes son "No diagram", retorna error sin continuar al paso 2
- **Paso 2**: Genera código con `qwen2.5-coder:14b` usando el PlantUML extraído

**Parámetros:**
- `model` (string, requerido): Nombre del modelo en Ollama
- `prompt` (string, requerido): Descripción de lo que quieres generar
- `messages` (string, opcional): Historial de mensajes en formato JSON para contexto conversacional
- `images` (files, opcional): Hasta 5 imágenes del diagrama UML (máx 10MB cada una)
- `auto_mode` (string, opcional): "true" para activar generación en dos pasos

**Ejemplo básico:**
```bash
curl -X POST "http://localhost:8001/generate/stream" \
  -F "model=qwen3-vl:8b" \
  -F "prompt=Crea una clase Usuario en Python"
```

**Ejemplo con contexto:**
```bash
curl -X POST "http://localhost:8001/generate/stream" \
  -F "model=qwen2.5-coder:14b" \
  -F "prompt=Ahora añade un método para validar el email" \
  -F 'messages=[{"role":"user","content":"Crea una clase Usuario"},{"role":"assistant","content":"class User:..."}]'
```

**Respuesta esperada (SSE):**
```
data: class
data:  User
data: Manager
data: :
data: \n
data:     def
data:  __init__
data: ...
data: [DONE]
```

**Errores posibles:**
- `400` - Imagen demasiado grande (>10MB), más de 5 imágenes, o parámetros inválidos
- `500` - Error en la generación o modelo no disponible
- `503` - Ollama no está corriendo

---

### 📚 Documentación Interactiva

FastAPI genera documentación automática:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

Desde Swagger UI puedes probar todos los endpoints directamente.

---

## 🧰 Estructura de respuesta de Ollama

Este servicio interpreta automáticamente las respuestas más comunes del API de Ollama:

**Formato 1:**
```json
{
  "message": {
    "content": "código generado..."
  }
}
```

**Formato 2:**
```json
{
  "choices": [
    {
      "message": {
        "content": "código generado..."
      }
    }
  ]
}
```

**Formato 3:**
```json
{
  "response": "código generado..."
}
```

El servicio maneja automáticamente estos formatos y extrae el contenido en la función `_extract_content()` de `app/routes/generate.py`.

---

## 🔄 Flujo de Ejecución

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ POST /generate/
       │ (model, prompt, image?)
       ↓
┌──────────────────┐
│  FastAPI Server  │
│  ┌────────────┐  │
│  │ Validación │  │ ← Tamaño imagen, parámetros
│  └──────┬─────┘  │
│         ↓        │
│  ┌────────────┐  │
│  │  Ollama    │  │ ← Convierte imagen a base64
│  │  Service   │  │   Construye payload
│  └──────┬─────┘  │
└─────────┼────────┘
          │ HTTP POST
          ↓
    ┌──────────┐
    │  Ollama  │ ← Modelo de IA local
    │  Server  │
    └──────┬───┘
           │ Respuesta JSON
           ↓
    ┌─────────────┐
    │  Extract    │ ← Maneja 3 formatos
    │  Content    │
    └──────┬──────┘
           │
           ↓
    ┌─────────────┐
    │  Response   │ → {"result": "código..."}
    └─────────────┘
```
---

## � Solución de Problemas Comunes

### Timeout con modelos grandes

**Problema:** Error de timeout al usar modelos grandes (gemma3:27b, llama3:70b, etc.)

**Síntomas:**
```
requests.exceptions.ReadTimeout: HTTPConnectionPool(host='localhost', port=11434): 
Read timed out. (read timeout=600)
```

**Solución:**

1. **Aumentar el timeout en `.env`:**
```env
# Para modelos 27B+
OLLAMA_TIMEOUT=900

# Para modelos 70B+
OLLAMA_TIMEOUT=1800
```

2. **Reiniciar el servidor:**
```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
./run.sh
```

3. **Verificar que se aplicó:**
```bash
# Los logs deberían mostrar:
# "Calling Ollama with model: gemma3:27b (timeout: 900s)"
```

**Recomendaciones por tamaño de modelo:**
- **7B** (llama3.2, mistral): 60-120 segundos
- **13B** (llama3.1:13b): 120-300 segundos
- **27B** (gemma3:27b): 600-900 segundos
- **70B+** (llama3:70b): 1200-1800 segundos (20-30 min)

---

### Request timeout en el cliente

**Problema:** El cliente (curl, navegador) se desconecta antes de recibir respuesta.

**Solución con curl:**
```bash
# Aumentar el timeout del cliente
curl --max-time 900 -X POST "http://localhost:8001/generate/" \
  -F "model=gemma3:27b" \
  -F "prompt=Tu prompt" \
  -F "image=@imagen.png"
```

**Solución en código JavaScript/TypeScript:**
```javascript
// Aumentar timeout en fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 min

fetch('http://localhost:8001/generate/', {
  method: 'POST',
  body: formData,
  signal: controller.signal
})
  .finally(() => clearTimeout(timeoutId));
```

---

### Imagen demasiado grande

**Error:** `400 - Imagen demasiado grande. Máximo 10MB`

**Solución:**
1. Reducir el tamaño de la imagen
2. O modificar el límite en `app/routes/generate.py`:
```python
# Línea ~35
if len(image_bytes) > 20 * 1024 * 1024:  # Aumentar a 20MB
```

---

### Modelo no cargado/Respuesta lenta

**Problema:** La primera petición a un modelo tarda mucho.

**Causa:** Ollama carga el modelo en memoria en la primera petición.

**Solución:**
```bash
# Pre-cargar el modelo antes de usarlo
ollama run gemma3:27b "test"
# Ctrl+D para salir

# Ahora el modelo está en memoria y responderá más rápido
```

---

### Imágenes no son diagramas UML

**Error:** `Las imágenes proporcionadas no se corresponden con diagramas UML`

**Causa:** El modelo `qwen3-vl:8b` detectó que ninguna de las imágenes proporcionadas contiene diagramas UML válidos.

**Solución:**
1. Verificar que las imágenes sean diagramas UML (clase, secuencia, casos de uso, etc.)
2. Asegurar que los diagramas sean claros y legibles
3. Si es un diagrama UML pero no se detecta, intenta:
   - Mejorar la calidad de la imagen
   - Aumentar el contraste del diagrama
   - Usar formato PNG en lugar de JPG
4. Para texto sin imágenes, desactiva el modo automático y usa directamente. `qwen2.5-coder:14b`

---

## �📚 Recursos

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Ollama](https://ollama.ai/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Modelos disponibles en Ollama](https://ollama.ai/library)
- [Guía de APIs REST](https://restfulapi.net/)

---

## 📊 Tecnologías Utilizadas

### Node.js API Gateway
- **Express.js** 4.18+ - Framework web para Node.js
- **PostgreSQL** 14+ - Base de datos relacional
- **pg** - Cliente PostgreSQL para Node.js
- **bcrypt** - Hashing de contraseñas
- **jsonwebtoken (JWT)** - Autenticación basada en tokens
- **express-validator** - Validación de datos
- **multer** - Manejo de archivos multipart
- **cors** - Configuración de CORS
- **dotenv** - Gestión de variables de entorno
- **winston** - Sistema de logging

### FastAPI Backend (IA)
- **FastAPI** 0.100+ - Framework web moderno y rápido
- **Pydantic** V2 - Validación de datos
- **Uvicorn** - Servidor ASGI
- **Python-multipart** - Manejo de archivos multipart
- **Requests** - Cliente HTTP
- **Python-dotenv** - Gestión de variables de entorno
- **Pillow** - Procesamiento de imágenes

### Herramientas Externas
- **Ollama** - Servidor de modelos de IA local
- **PostgreSQL** - Base de datos relacional

---

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado de la Universidad de Castilla La Mancha.

## 📧 Contacto

- 📧 fernandomm1840@gmail.com

---

**Desarrollado por**: Fernando Martín