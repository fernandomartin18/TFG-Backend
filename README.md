<div align="center">
  <img src="./assets/Genesis_Horizontal_Violet.png" alt="Genesis Logo" width="400" />
</div>

# Genesis Backend

El núcleo de orquestación, almacenamiento e Inteligencia Artificial de la plataforma **Genesis**. Está diseñado con una arquitectura robusta de dos capas para procesar solicitudes del usuario, gestionar la autenticación y conectarse con modelos LLM locales mediante Ollama para generar código y analizar diagramas UML.

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
```

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
