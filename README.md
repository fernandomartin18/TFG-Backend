<div align="center">
  <img src="./assets/Genesis_Horizontal_Violet.png" alt="Genesis Logo" width="400" />
</div>

# Genesis Backend

The orchestration, storage, and Artificial Intelligence core of the **Genesis** platform. It is designed with a resilient two-layer architecture to handle user requests, manage authentication, and connect to local LLM models via Ollama to generate code and analyze UML diagrams.

> 🖥️ **Frontend repository:** https://github.com/fernandomartin18/TFG-Frontend.

> 🌐 **Learn more:** Visit the [Genesis landing page](https://fernandomartin.tech/genesis) for a full project overview.
 
> This is the Backend repository for Genesis. For step-by-step installation instructions for the whole ecosystem (including database, Python, and Node.js), see the file [INSTALACION.md](./INSTALACION.md).

## 📑 Table of Contents

- [🧠 Two-Layer Architecture](#-two-layer-architecture)
- [📂 Project Structure](#-project-structure)
- [✨ Key Features](#-key-features)
- [🌐 Main API Endpoints](#-main-api-endpoints)
- [🔄 Generation Flow (Stream Mode)](#-generation-flow-stream-mode)
- [🛠️ Common Backend Troubleshooting](#️-common-backend-troubleshooting)

## 🧠 Two-Layer Architecture

Genesis separates routing responsibilities from AI processing into two specialized services that operate in an orchestrated manner.

### 🟢 Node.js API Gateway (Port 3000)
The gateway for the frontend and the main entrypoint server.
- **JWT Authentication:** Secure access and token refresh management (`bcrypt` + `jsonwebtoken`).
- **PostgreSQL Persistence:** Stores user profiles, chat histories, projects, and settings.
- **Reverse Proxy:** Routes heavy or streaming requests to the AI service.
- **Data Validation:** Initial processing of files (base64/multipart images) and sanitization using `express-validator`.

### 🔵 FastAPI (Port 8001)
The heavy-lifting AI processing engine developed in Python.
- **Communication with Ollama:** Direct HTTP connection to the local model engine (`/api/chat`, `/api/tags`).
- **Two-Step Generation (Auto Mode):** Extract PlantUML from diagrams → Generate code.
- **Image Processing:** Conversion and validation of up to 5 UML diagrams in parallel.
- **Asynchronous Streaming:** Progressive emission of Server-Sent Events (SSE) for real-time feedback.

---

## 📂 Project Structure

```text
backend/
├── src/                          # API Gateway (Express + Node.js)
│   ├── server.js                # Express server entrypoint
│   ├── config/
│   │   ├── index.js             # Centralized configuration
│   │   └── database.js          # PostgreSQL connection pool
│   ├── routes/
│   │   ├── index.js             # Route registration
│   │   ├── auth.routes.js       # Auth routes
│   │   ├── users.routes.js      # Users routes
│   │   ├── chats.routes.js      # Chats routes
│   │   ├── messages.routes.js   # Messages routes
│   │   ├── projects.routes.js   # Projects routes
│   │   ├── templates.routes.js  # Templates routes
│   │   ├── plantuml.routes.js   # PlantUML template routes
│   │   ├── models.routes.js     # Ollama models routes
│   │   └── generate.routes.js   # AI generation routes
│   ├── controllers/
│   │   ├── auth.controller.js       # Auth logic
│   │   ├── users.controller.js      # Users logic
│   │   ├── chats.controller.js      # Chats logic
│   │   ├── messages.controller.js   # Messages logic
│   │   ├── projects.controller.js   # Projects logic
│   │   ├── templates.controller.js  # Templates logic
│   │   ├── plantuml.controller.js   # PlantUML templates logic
│   │   ├── models.controller.js     # Models logic
│   │   └── generate.controller.js   # Generation logic
│   ├── services/
│   │   ├── auth.service.js      # JWT and bcrypt
│   │   └── ollama.service.js    # HTTP client for FastAPI
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── validation.middleware.js # Validation handling
│   │   ├── validators.js            # Validation rules
│   │   └── error.middleware.js      # Error handling
│   ├── db/
│   │   ├── index.js             # Exports all DB modules
│   │   ├── users.js             # Users operations
│   │   ├── chats.js             # Chats operations
│   │   ├── messages.js          # Messages operations
│   │   ├── message_images.js    # Image operations
│   │   ├── projects.js          # Projects operations
│   │   ├── templates.js         # Templates operations
│   │   ├── plantuml.js          # PlantUML templates operations
│   │   ├── generated_codes.js   # Generated code operations
│   │   ├── schema.sql           # Database schema
│   │   └── README.md            # DB documentation
│   └── utils/
│       └── logger.js            # Logging system
├── package.json
├── .env
├── .gitignore
├── README.md
├── API_AUTH.md                   # Authentication documentation
│
└── llmapi/                       # AI backend (FastAPI + Python)
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── routes/
    │   │   ├── generate.py      # Code generation endpoint
    │   │   └── models.py        # Models endpoint
    │   ├── services/
    │   │   └── ollama_service.py # Communication with Ollama
    │   ├── schemas/
    │   │   └── generate_request.py # Pydantic models
    │   └── core/
    │       ├── config.py        # Environment variables
    │       └── logger.py        # Logging
    ├── requirements.txt
    ├── setup.sh
    ├── run.sh
    ├── .env
    └── .venv/
```

---

## ✨ Key Features

### 💾 Advanced Data Management (PostgreSQL)
- **Strategic Relationships:** Automatic cascades (`ON DELETE CASCADE`) to ensure referential integrity when removing users or projects.
- **Projects and Chats:** Hierarchical organization of conversations.
- **Custom Templates:** Users can save prompt snippets or PlantUML diagrams for reuse.

### 🤖 Generation Engine (Ollama)
- **Smart Auto Mode:** Uses a vision model (e.g., `qwen3-vl:8b`) to translate a UML diagram into intermediate code, then switches to a code-specialized model (like `qwen2.5-coder:14b`) to generate the final output.
- **Adjustable Timeouts:** Dynamic timeout configuration for large (27B+) and medium (7B, 14B) models.
- **Memory Management:** Specific endpoints (`/api/models/unload`) to free RAM/VRAM when a model is no longer required.

### 🔐 Security and Authentication
- **Transparent Refresh Flow:** Refresh token architecture persisted in the database.
- **Secure Passwords:** Hashed with 10 salt rounds.
- **Strict Rules:** Password validation (upper/lowercase, numbers, >6 chars) and protection against SQL injection by using query params (`pg`).

---

## 🌐 Main API Endpoints

The Genesis API exposes multiple resource-oriented endpoints. (Add `Authorization: Bearer <token>` for protected routes 🔒).

### Authentication and Users
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/profile` 🔒 - Current user profile
- `PUT /api/users/me` 🔒 - Update avatar/email

### Organization (Chats & Projects)
- `GET /api/projects` 🔒 - List project folders
- `POST /api/projects` 🔒 - Create folder
- `GET /api/chats` 🔒 - List chat history
- `POST /api/chats` 🔒 - Start a new chat (with or without project)
- `POST /api/messages` 🔒 - Persist messages to the database

### Artificial Intelligence (Gateway → FastAPI)
- `GET /api/models` - Discover available Ollama models (`/models/` in FastAPI).
- `POST /api/generate` - Blocking generation endpoint.
- `POST /api/generate/stream` - Streaming generation (Server-Sent Events) with support for context and images.
- `POST /api/models/unload` - Unload an active model from memory.

---

## 🔄 Generation Flow (Stream Mode)

When the user sends a chat request the system executes the following flow:

1. **Frontend** sends `POST /api/generate/stream` (multipart with images + text + history) to the **API Gateway (Node.js)**.
2. The Gateway validates file sizes (<10MB) and forwards the request to **FastAPI** (`POST /generate/stream`).
3. **FastAPI** analyzes the request:
   - *Are there images and is Auto Mode active?*
     - Step 1: Emit `[STEP1_START]`, query Ollama (vision model), extract PlantUML, emit `[STEP1_END]`.
     - Step 2: Emit `[STEP2_START]`, query Ollama (code model) with the PlantUML as context.
   - *Is it only text?* Send directly to the code model.
4. **FastAPI** receives Ollama output chunk by chunk (streaming) and sends it as Server-Sent Events to the Gateway, which relays them to the Frontend.
5. The system emits `[DONE]` and the Frontend persists the final message via `POST /api/messages`.

---

## 🛠️ Common Backend Troubleshooting

- **`Read timed out. (read timeout=600)`**: The model is very large and Ollama needs more time to infer. Increase `OLLAMA_TIMEOUT` in FastAPI and `REQUEST_TIMEOUT` in Node.js.
- **`503 - Service Unavailable`**: Verify that the Ollama base service is running (`ollama serve`).
- **CORS Errors or Expired Token**: If the frontend cannot log in, verify that `JWT_SECRET` in Node.js and your system clock are correct. Also ensure the frontend is served from a URL listed in `ALLOWED_ORIGINS`.

---
> For live API docs of the AI endpoints, start the FastAPI service and visit [http://localhost:8001/docs](http://localhost:8001/docs).

---

<div align="center">
  <img src="./assets/Genesis_Horizontal_Violet.png" alt="Genesis Logo" width="400" />
</div>

# Genesis Backend

El núcleo de orquestación, almacenamiento e Inteligencia Artificial de la plataforma **Genesis**. Está diseñado con una arquitectura robusta de dos capas para procesar solicitudes del usuario, gestionar la autenticación y conectarse con modelos LLM locales mediante Ollama para generar código y analizar diagramas UML.

> 🖥️ **Repositorio para el Frontend:** https://github.com/fernandomartin18/TFG-Frontend.

> 🌐 **Descubre más:** Puedes visitar la [Landing Page de Genesis](https://fernandomartin.tech/genesis) para ver una presentación completa del proyecto.
 
> Este es el repositorio del Backend de Genesis. Para las instrucciones de instalación paso a paso de todo el ecosistema (incluyendo base de datos, Python, y Node.js), consulta el archivo [INSTALACION.md](./INSTALACION.md).

## 📑 Índice

- [🧠 Arquitectura de Dos Capas](#-arquitectura-de-dos-capas)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🌐 API Endpoints Principales](#-api-endpoints-principales)
- [🔄 Flujo de Generación (Stream Mode)](#-flujo-de-generación-stream-mode)
- [🛠️ Solución de Problemas Comunes (Backend)](#️-solución-de-problemas-comunes-backend)

## 🧠 Arquitectura de Dos Capas

Genesis separa las responsabilidades de enrutamiento y procesamiento IA en dos servicios especializados que operan de forma orquestada.

### 🟢 Node.js API Gateway (Puerto 3000)
Es la puerta de enlace para el frontend y actúa como servidor principal.
- **Autenticación JWT:** Gestión segura de acceso y refresco de tokens (`bcrypt` + `jsonwebtoken`).
- **Persistencia en PostgreSQL:** Almacena perfiles de usuarios, historiales de chats, proyectos y configuraciones.
- **Proxy Inverso:** Enruta peticiones pesadas o de streaming hacia el servicio de IA.
- **Validación de Datos:** Procesamiento inicial de archivos (imágenes base64/multipart) y sanitización con `express-validator`.

### 🔵 FastAPI (Puerto 8001)
El motor de procesamiento intensivo de Inteligencia Artificial desarrollado en Python.
- **Comunicación con Ollama:** Conexión HTTP directa con el motor de modelos locales (`/api/chat`, `/api/tags`).
- **Generación en Dos Pasos (Auto Mode):** Extracción de PlantUML desde diagramas → Generación de código.
- **Procesamiento de Imágenes:** Conversión y validación de hasta 5 diagramas UML simultáneos.
- **Streaming Asíncrono:** Emisión progresiva de Server-Sent Events (SSE) para feedback en tiempo real.

---

## 📂 Estructura del Proyecto

```text
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
│   │   ├── templates.routes.js  # Rutas de plantillas
│   │   ├── plantuml.routes.js   # Rutas de plantillas PlantUML
│   │   ├── models.routes.js     # Rutas de modelos Ollama
│   │   └── generate.routes.js   # Rutas de generación IA
│   ├── controllers/
│   │   ├── auth.controller.js       # Lógica de autenticación
│   │   ├── users.controller.js      # Lógica de usuarios
│   │   ├── chats.controller.js      # Lógica de chats
│   │   ├── messages.controller.js   # Lógica de mensajes
│   │   ├── projects.controller.js   # Lógica de proyectos
│   │   ├── templates.controller.js  # Lógica de plantillas
│   │   ├── plantuml.controller.js   # Lógica de plantillas PlantUML
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
│   │   ├── templates.js         # Operaciones de plantillas
│   │   ├── plantuml.js          # Operaciones de plantillas PlantUML
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

---

## ✨ Características Principales

### 💾 Gestión Avanzada de Datos (PostgreSQL)
- **Relaciones Estratégicas:** Cascadas automáticas (`ON DELETE CASCADE`) para garantizar la integridad referencial al eliminar usuarios o proyectos.
- **Proyectos y Chats:** Organización jerárquica de conversaciones.
- **Plantillas Personalizadas:** El usuario puede guardar fragmentos de prompts o diagramas PlantUML para su reutilización.

### 🤖 Motor de Generación (Ollama)
- **Modo Auto Inteligente:** Permite usar un modelo de visión (por ejemplo `qwen3-vl:8b`) para traducir un diagrama UML a código intermedio, y automáticamente cambiar a un modelo especializado en código (como `qwen2.5-coder:14b`) para generar el resultado final.
- **Timeouts Ajustables:** Configuración dinámica de tiempos de espera adaptados a modelos grandes (27B+) y medianos (7B, 14B).
- **Gestión de Memoria:** Endpoints específicos (`/api/models/unload`) para liberar RAM/VRAM cuando ya no se requiere un modelo.

### 🔐 Seguridad y Autenticación
- **Renovación Transparente:** Arquitectura de *Refresh Tokens* en base de datos.
- **Contraseñas Seguras:** Hasheadas con 10 salt rounds.
- **Reglas Estrictas:** Validación de contraseñas (mayúsculas, minúsculas, números, >6 caracteres) y protección contra inyecciones SQL usando query params (`pg`).

---

## 🌐 API Endpoints Principales

La API de Genesis ofrece múltiples puntos de acceso organizados por recursos. (Añade `Authorization: Bearer <token>` para rutas protegidas 🔒).

### Autenticación y Usuarios
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Renovar tokens
- `GET /api/auth/profile` 🔒 - Perfil de usuario actual
- `PUT /api/users/me` 🔒 - Actualizar avatar/email

### Organización (Chats y Proyectos)
- `GET /api/projects` 🔒 - Listar carpetas de proyectos
- `POST /api/projects` 🔒 - Crear carpeta
- `GET /api/chats` 🔒 - Listar historial de conversaciones
- `POST /api/chats` 🔒 - Iniciar nuevo chat (sin/con proyecto)
- `POST /api/messages` 🔒 - Guardar mensajes en la base de datos

### Inteligencia Artificial (Gateway → FastAPI)
- `GET /api/models` - Descubre los modelos de Ollama disponibles (`/models/` en FastAPI).
- `POST /api/generate` - Generación simple bloqueante.
- `POST /api/generate/stream` - Generación por Streaming (Server-Sent Events) progresiva, con soporte de contexto e imágenes.
- `POST /api/models/unload` - Liberar modelo de memoria activa.

---

## 🔄 Flujo de Generación (Stream Mode)

Cuando el usuario envía una petición de chat, el sistema ejecuta el siguiente flujo:

1. **Frontend** envía petición `POST /api/generate/stream` (Multipart con imágenes + texto + historial) al **API Gateway (Node.js)**.
2. El Gateway valida tamaño de archivos (<10MB) y retransmite a **FastAPI** (`POST /generate/stream`).
3. **FastAPI** analiza la petición:
   - *¿Hay imágenes y está activo el Auto Mode?*
     - Paso 1: Manda evento `[STEP1_START]`, consulta a Ollama (Modelo de visión), extrae PlantUML, envía `[STEP1_END]`.
     - Paso 2: Manda evento `[STEP2_START]`, consulta a Ollama (Modelo de código) con el PlantUML como contexto.
   - *¿Es solo texto?* Envía directamente al modelo de código.
4. **FastAPI** recibe la salida de Ollama chunk a chunk (Streaming) y la envía como Server-Sent Events al Gateway, quien la reenvía al Frontend.
5. El sistema envía `[DONE]` y el Frontend almacena el mensaje final vía `POST /api/messages`.

---

## 🛠️ Solución de Problemas Comunes (Backend)

- **`Read timed out. (read timeout=600)`**: El modelo es muy grande y Ollama necesita más tiempo para inferir. Aumenta `OLLAMA_TIMEOUT` en FastAPI y `REQUEST_TIMEOUT` en Node.js.
- **`503 - Service Unavailable`**: Verifica que el servicio de Ollama base esté corriendo (`ollama serve`).
- **CORS Errors o Token Expirado**: Si el frontend es incapaz de hacer login, verifica que `JWT_SECRET` en Node.js y la hora de tu sistema operativo sean correctas. Además, asegúrate de que el frontend se sirve bajo una URL listada en `ALLOWED_ORIGINS`.

---
> Para la documentación en vivo de los endpoints de IA, arranca el servicio FastAPI y visita [http://localhost:8001/docs](http://localhost:8001/docs).
