# Backend de la aplicación del TFG

Backend de la aplicación que genera código híbrido a partir de **diagramas de clases** o **descripciones textuales** usando modelos de IA locales con Ollama.

## 📑 Índice

- [🚀 Inicio Rápido](#-inicio-rápido)
- [📋 Requisitos Previos](#-requisitos-previos)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [⚙️ Qué hace cada módulo](#️-qué-hace-cada-módulo)
- [🔐 Archivo .env](#-archivo-env-no-incluido-en-el-repo)
- [🚀 Instalación y Ejecución](#-instalación-y-ejecución-local)
- [🔍 Verificación de Estado](#-verificación-de-estado)
- [🧪 Endpoints Disponibles](#-endpoints-disponibles)
- [🧰 Estructura de Respuesta de Ollama](#-estructura-de-respuesta-de-ollama)
- [📝 Mejoras Implementadas](#-mejoras-implementadas)
- [🐛 Solución de Problemas](#-solución-de-problemas)
- [🔄 Flujo de Ejecución](#-flujo-de-ejecución)
- [⚠️ Notas Importantes](#️-notas-importantes)
- [🧩 Próximos Pasos](#-próximos-pasos)
- [🧾 Comandos Útiles](#-comandos-útiles)
- [📚 Recursos](#-recursos)

---

## 🚀 Inicio Rápido

### Opción 1: Inicio Automático (RECOMENDADO) 🌟

```bash
cd fastapi
./start.sh
```

Este script:
- ✅ Verifica e inicia Ollama automáticamente
- ✅ Verifica modelos instalados
- ✅ Te pregunta si quieres descargar un modelo (si no tienes)
- ✅ Arranca el servidor FastAPI

### Opción 2: Inicio Manual

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

### Scripts de utilidad:

| Script | Descripción |
|--------|-------------|
| `setup.sh` | Instalación automática: crea entorno virtual, instala dependencias y configura `.env`. |
| `run.sh` | Ejecuta el servidor FastAPI (requiere `setup.sh` previo). |
| `start.sh` | **Script todo-en-uno**: verifica Ollama, ofrece descargar modelos y arranca el servidor. |
| `check_ollama.sh` | Verifica estado de Ollama, modelos instalados y sugiere modelos recomendados. |
| `test_setup.py` | Verifica que todas las importaciones y configuración funcionan correctamente. |

---

## 📋 Requisitos Previos

1. **Python 3.10+**
2. **Pip** actualizado: `python -m pip install --upgrade pip`
3. **Ollama** instalado y ejecutándose localmente
   - 👉 [Descargar Ollama](https://ollama.ai)
   - Verificar instalación: `ollama --version`
4. **Al menos un modelo descargado** (recomendado: `qwen2-vl` para multimodal)

### Instalación de Ollama y modelos:

```bash
# Descargar e instalar Ollama desde https://ollama.ai

# Iniciar Ollama
ollama serve

# En otra terminal, descargar un modelo
# Para análisis de diagramas + código (multimodal, 4.4GB):
ollama pull qwen2-vl

# O solo para código (más rápido, 3.8GB):
ollama pull codellama

# Verificar modelos instalados
ollama list
```

---

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

#### Opción A: Script automático (verifica Ollama)

```bash
./start.sh
```

#### Opción B: Solo servidor

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

## � Verificación de Estado

### Verificar configuración de Ollama

```bash
./check_ollama.sh
```

Muestra:
- ✅/❌ Si Ollama está instalado
- ✅/❌ Si Ollama está corriendo
- 📦 Modelos instalados
- 💡 Sugerencias de modelos recomendados

### Verificar configuración de Python

```bash
source .venv/bin/activate
python test_setup.py
```

Verifica:
- Todas las importaciones
- Schemas Pydantic
- Configuración de variables de entorno

### Verificar servidor

```bash
# Health check
curl http://localhost:8001/

# Debería devolver:
# {"message":"FastAPI IA service running","status":"ok"}
```

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

## 📝 Mejoras Implementadas

### Arquitectura y Código
- ✅ **Type hints completos** - Mejor autocompletado y detección de errores
- ✅ **Compatibilidad Python 3.9+** - Usando `Optional[]` en lugar de `|`
- ✅ **Docstrings completos** - En todas las funciones con descripción de parámetros
- ✅ **Validación robusta** - Límite de tamaño de imagen (10MB), validación de entrada
- ✅ **Manejo de errores específico** - HTTPException con códigos apropiados (400, 500, 503)

### Logging y Monitoreo
- ✅ **Logging detallado** - Trazabilidad completa de requests
- ✅ **Nivel configurable** - LOG_LEVEL desde variable de entorno
- ✅ **Formato mejorado** - Timestamp, nivel y nombre del módulo

### Configuración
- ✅ **CORS configurable** - Soporte para múltiples orígenes
- ✅ **Variables centralizadas** - Todas en `.env`
- ✅ **URLs construidas automáticamente** - Desde `OLLAMA_BASE_URL`

### Documentación
- ✅ **OpenAPI/Swagger** - Documentación automática en `/docs`
- ✅ **Schemas Pydantic** - Con ejemplos para la documentación
- ✅ **Scripts automatizados** - Para instalación, ejecución y verificación

---

## 🐛 Solución de Problemas

### Error: "No se ha podido resolver la importación"

**Causa:** Dependencias no instaladas o entorno virtual no activado.

**Solución:**
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

O ejecuta:
```bash
./setup.sh
```

---

### Error: "Connection refused" al llamar a Ollama

**Causa:** Ollama no está corriendo.

**Solución:**
```bash
# Verificar que Ollama esté corriendo
curl http://localhost:11434/api/tags

# Si no responde, iniciarlo
ollama serve

# O como servicio (macOS)
brew services start ollama
```

---

### Error: "No hay modelos disponibles"

**Causa:** No tienes modelos descargados en Ollama.

**Solución:**
```bash
# Listar modelos
ollama list

# Si no hay ninguno, descargar uno
ollama pull qwen2-vl  # Multimodal (recomendado)
# O
ollama pull codellama  # Solo código
```

---

### El servidor no inicia (puerto ocupado)

**Causa:** El puerto 8001 está siendo usado por otro proceso.

**Solución:**
```bash
# Ver qué proceso usa el puerto
lsof -ti:8001

# Matar el proceso
kill -9 $(lsof -ti:8001)

# O cambiar el puerto en .env
PORT=8002
```

---

### Imagen demasiado grande

**Error:** `400 - Imagen demasiado grande. Máximo 10MB`

**Solución:**
- Reduce el tamaño de la imagen
- O modifica el límite en `app/routes/generate.py` (línea ~35)

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

## ⚠️ Notas Importantes

### Al arrancar el servidor

El servidor FastAPI **NO se conecta a Ollama** al iniciar. Solo:
1. Carga la configuración (`.env`)
2. Inicializa FastAPI y registra endpoints
3. Configura CORS
4. Imprime logs de inicio
5. Espera peticiones HTTP

La conexión a Ollama **solo ocurre** cuando se llama a `/models/` o `/generate/`.

### Entorno de desarrollo

- Los errores de Pylance sobre importaciones son normales hasta instalar dependencias
- Usa el entorno virtual `.venv` para evitar conflictos
- El modo `--reload` recarga automáticamente al cambiar código

### Producción

- Cambia `HOST` a la IP específica o mantén `0.0.0.0`
- Ajusta `ALLOWED_ORIGINS` con los dominios reales
- Usa un gestor de procesos (systemd, supervisor)
- Considera usar un proxy inverso (nginx)
- Cambia `LOG_LEVEL` a `WARNING` o `ERROR`

---

## 🧩 Próximos pasos

- [ ] Implementar tests unitarios (pytest)
- [ ] Añadir streaming de respuestas desde Ollama
- [ ] Implementar caché de respuestas
- [ ] Integrar con el Gateway Node.js
- [ ] Añadir parseo estructurado del código generado
- [ ] Añadir métricas y monitoreo
- [ ] Dockerizar la aplicación
- [ ] Implementar rate limiting
- [ ] Añadir autenticación/autorización

---

## 🧾 Comandos Útiles

| Acción | Comando |
|--------|---------|
| **Instalación** | |
| Crear entorno virtual | `python -m venv .venv` |
| Activar entorno (macOS/Linux) | `source .venv/bin/activate` |
| Activar entorno (Windows) | `.venv\Scripts\Activate.ps1` |
| Instalar dependencias | `pip install -r requirements.txt` |
| Instalación completa | `./setup.sh` |
| **Ollama** | |
| Iniciar Ollama | `ollama serve` |
| Iniciar como servicio (macOS) | `brew services start ollama` |
| Listar modelos | `ollama list` |
| Descargar modelo | `ollama pull qwen2-vl` |
| Probar modelo | `ollama run qwen2-vl` |
| **Servidor** | |
| Ejecutar servidor (completo) | `./start.sh` |
| Ejecutar servidor (solo API) | `./run.sh` |
| Ejecutar manualmente | `uvicorn app.main:app --reload` |
| Ver logs en tiempo real | `tail -f uvicorn.log` |
| **Verificación** | |
| Verificar Ollama | `./check_ollama.sh` |
| Verificar configuración | `python test_setup.py` |
| Health check | `curl http://localhost:8001/` |
| Listar modelos | `curl http://localhost:8001/models/` |
| **Testing** | |
| Probar endpoints | Abrir http://localhost:8001/docs |
| Generar código | Ver ejemplos en sección de endpoints |
| **Detener** | |
| Detener servidor | `Ctrl + C` |
| Detener Ollama (servicio) | `brew services stop ollama` |
| Detener Ollama (manual) | `Ctrl + C` |

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

## 👥 Desarrollo

### Estructura del proyecto

El proyecto sigue una arquitectura en capas:

- **Routes** (`app/routes/`): Endpoints de la API
- **Services** (`app/services/`): Lógica de negocio
- **Schemas** (`app/schemas/`): Modelos de datos
- **Core** (`app/core/`): Configuración y utilidades

### Convenciones de código

- Type hints en todas las funciones
- Docstrings en formato Google
- Logging en puntos estratégicos
- Manejo explícito de errores
- Validación de entrada con Pydantic

### Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit: `git commit -am 'Añade nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

[Especificar licencia del proyecto]

---

## 📧 Contacto

[Información de contacto o links relevantes]