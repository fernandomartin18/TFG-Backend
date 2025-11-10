# Backend de la aplicación del TFG

Backend de la aplicación que genera código híbrido a partir de **diagramas de clases** o **descripciones textuales** usando modelos de IA locales con Ollama.

## 📑 Índice

- [🚀 Inicio Rápido](#-inicio-rápido)
- [📋 Requisitos Previos](#-requisitos-previos)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [⚙️ Qué hace cada módulo](#️-qué-hace-cada-módulo)
- [🔐 Archivo .env](#-archivo-env-no-incluido-en-el-repo)
- [🚀 Instalación y Ejecución](#-instalación-y-ejecución-local)
- [🧪 Endpoints Disponibles](#-endpoints-disponibles)
- [🧰 Estructura de Respuesta de Ollama](#-estructura-de-respuesta-de-ollama)
- [🔄 Flujo de Ejecución](#-flujo-de-ejecución)
- [📚 Recursos](#-recursos)

---

## 🚀 Inicio Rápido

```bash
# Terminal 1: Iniciar Ollama
ollama serve

# Terminal 2: Iniciar servidor FastAPI
cd fastapi
./setup.sh  # Solo la primera vez
./run.sh
```

El servidor estará disponible en: **http://localhost:8001**
- **API Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

---

## 📂 Estructura del proyecto

```
tfg-backend/
├── fastapi/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── generate.py      # Endpoint principal: genera código a partir de texto o imagen
│   │   │   └── models.py         # Endpoint auxiliar: lista modelos disponibles en Ollama
│   │   ├── services/
│   │   │   └── ollama_service.py # Conexión HTTP con Ollama, manejo de imágenes base64
│   │   ├── schemas/
│   │   │   └── generate_request.py # Modelos de datos (entrada/salida) con Pydantic
│   │   └── core/
│   │       ├── config.py         # Carga de variables de entorno (.env)
│   │       └── logger.py         # Configuración básica de logging
│   │
│   ├── requirements.txt          # Dependencias de Python
│   ├── .env                      # Variables de entorno (NO se sube al repositorio)
│   └── README.md                 # Este archivo
└── node/                         # API Gateway (Node.js)
```

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
3. **Ollama** instalado y ejecutándose localmente
   - 👉 [Descargar Ollama](https://ollama.ai)
   - Verificar instalación: `ollama --version`
4. **Al menos un modelo descargado**

## 🔐 Archivo .env (no incluido en el repo)

Debes crear un archivo `.env` en la raíz de `fastapi/` con este contenido:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Server Configuration
HOST=0.0.0.0
PORT=8001

# CORS Configuration (comma-separated list)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

**Nota:** El script `setup.sh` crea automáticamente este archivo si no existe.

---

## 🚀 Instalación y ejecución local

### Instalación Automática (Recomendado)

```bash
cd tfg-backend/fastapi
./setup.sh
```

Esto hace:
1. Verifica Python 3.10+
2. Crea entorno virtual `.venv`
3. Instala todas las dependencias
4. Crea archivo `.env` si no existe

### Instalación Manual

#### 1️⃣ Navegar a la carpeta

```bash
cd tfg-backend/fastapi
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

### Ejecución

```bash
./run.sh
```

#### Opción C: Manual

```bash
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

El servidor se iniciará en: **http://localhost:8001**

---

## 🧪 Endpoints disponibles

### 🟢 GET / - Health Check

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

### 🔵 POST /generate/ - Generar Código

**Descripción:** Genera código a partir de un prompt y opcionalmente una imagen (diagrama UML).

**Parámetros:**
- `model` (string, requerido): Nombre del modelo en Ollama
- `prompt` (string, requerido): Descripción de lo que quieres generar
- `image` (file, opcional): Imagen del diagrama UML (máx 10MB)

**Ejemplo sin imagen:**
```bash
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen2-vl" \
  -F "prompt=Crea una clase Python para gestionar usuarios con métodos CRUD"
```

**Ejemplo con imagen:**
```bash
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen2-vl" \
  -F "prompt=Analiza el diagrama UML y genera el código Python correspondiente" \
  -F "image=@/ruta/a/diagrama.png"
```

**Respuesta esperada:**
```json
{
  "result": "class UserManager:\n    def __init__(self):\n        self.users = []\n    \n    def create_user(self, name, email):\n        ..."
}
```

**Errores posibles:**
- `400` - Imagen demasiado grande (>10MB) o parámetros inválidos
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

## 📚 Recursos

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Ollama](https://ollama.ai/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Modelos disponibles en Ollama](https://ollama.ai/library)
- [Guía de APIs REST](https://restfulapi.net/)

---

## 📊 Tecnologías Utilizadas

- **FastAPI** 0.100+ - Framework web moderno y rápido
- **Pydantic** V2 - Validación de datos
- **Uvicorn** - Servidor ASGI
- **Python-multipart** - Manejo de archivos multipart
- **Requests** - Cliente HTTP
- **Python-dotenv** - Gestión de variables de entorno
- **Pillow** - Procesamiento de imágenes
- **Ollama** - Servidor de modelos de IA local

---

## 📄 Licencia

Hacer más adelante

---

## 📧 Contacto

- 📧 fernandomm1840@gmail.com