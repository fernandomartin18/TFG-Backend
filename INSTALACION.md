# 🚀 Genesis Local Installation Guide

Este documento proporciona las instrucciones paso a paso para configurar y ejecutar todo el ecosistema de Genesis (Frontend, API Gateway y Servicio de IA) de manera local en tu máquina.

> Genesis consta de tres componentes principales: un frontend en React, un API Gateway en Node.js y un servicio de IA con FastAPI conectado a modelos locales gestionados por Ollama.

## 📋 Requisitos Previos Generales

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu sistema:

- **Node.js** (v18.0 o superior) y **npm/yarn**
- **Python** (v3.10 o superior) y **pip**
- **PostgreSQL** (v14.0 o superior)
- **Ollama** (para ejecución de modelos de IA locales)

---

## 🐘 1. Configuración de Base de Datos (PostgreSQL)

El API Gateway de Genesis utiliza PostgreSQL para almacenar usuarios, chats, proyectos y configuraciones.

1. Asegúrate de que el servicio de PostgreSQL esté en ejecución.
2. Inicia sesión en tu terminal de Postgres o en tu cliente preferido (pgAdmin, DBeaver, etc.) y crea la base de datos:

   ```sql
   CREATE DATABASE tfg_app;
   ```

3. Importa el esquema de la base de datos incluido en el proyecto:

   ```bash
   # Desde la raíz del proyecto
   psql -U postgres -d tfg_app -f backend/src/db/schema.sql
   ```
   *(Si tienes un volcado de datos, puedes usar `backup_tfg_completo.sql` ubicado en la raíz).*

---

## 🧠 2. Configuración de Modelos de IA (Ollama)

Genesis utiliza modelos locales para la generación de código (modelos de texto a código) y el análisis de diagramas (modelos de visión).

1. Descarga e instala [Ollama](https://ollama.ai) en tu sistema.
2. Verifica que el servidor de Ollama esté ejecutándose (por lo general arranca automáticamente o ejecuta `ollama serve` en una terminal).
3. Descarga los modelos base recomendados. Abre una terminal y ejecuta:

   ```bash
   # Modelo para extracción visual (PlantUML desde diagramas)
   ollama pull qwen3-vl:8b

   # Modelo principal para generación de código
   ollama pull qwen2.5-coder:14b

   # Opcional: Modelos más grandes o alternativos
   ollama pull gemma3:27b
   ```

> [!TIP]
> Puedes cambiar o descargar otros modelos según la capacidad de tu hardware. Genesis detectará automáticamente los modelos instalados.

---

## ⚙️ 3. Configuración del Servicio de IA (FastAPI)

Este servicio se encarga de comunicarse con Ollama, procesar imágenes, y devolver el código generado.

1. Navega al directorio del servicio de IA:
   ```bash
   cd backend/llmapi
   ```

2. Ejecuta el script de configuración inicial (crea el entorno virtual e instala dependencias):
   ```bash
   ./setup.sh
   ```
   *(Alternativa manual: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`)*

3. Configura las variables de entorno:
   El script anterior crea un `.env`. Puedes editarlo si es necesario.
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_TIMEOUT=600
   OLLAMA_TAGS_TIMEOUT=30
   HOST=0.0.0.0
   PORT=8001
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   LOG_LEVEL=INFO
   ```

4. Para arrancar el servicio de IA:
   ```bash
   ./run.sh
   # El servicio estará disponible en http://localhost:8001
   ```

---

## 🌐 4. Configuración del API Gateway (Node.js)

Este servicio maneja la autenticación, base de datos y actúa de proxy con el backend de IA.

1. En una **nueva terminal**, navega a la raíz del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea el archivo de variables de entorno `.env` en la carpeta `backend/`:
   ```bash
   cat << 'EOF' > .env
   FASTAPI_URL=http://localhost:8001
   PORT=3000
   NODE_ENV=development
   REQUEST_TIMEOUT=600000
   MAX_FILE_SIZE=10485760
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tfg_app
   DB_USER=postgres
   DB_PASSWORD=tu_password_aqui # CAMBIA ESTO
   DB_MAX_CONNECTIONS=20
   
   JWT_SECRET=super_secret_jwt_key
   JWT_REFRESH_SECRET=super_secret_refresh_key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   LOG_LEVEL=info
   EOF
   ```

4. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   # El servicio estará disponible en http://localhost:3000
   ```

---

## 💻 5. Configuración del Frontend (React)

Finalmente, configura la interfaz de usuario.

1. En una **nueva terminal**, navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea o renombra el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Asegúrate de que la API URL apunte al gateway: `VITE_API_URL=http://localhost:3000/api`)*

4. Arranca el entorno de desarrollo:
   ```bash
   npm run dev
   ```

---

## 🎉 Ejecución Final de Todo el Sistema

Para utilizar Genesis de manera local, necesitas mantener **4 procesos en terminales separadas** (3 si Ollama se ejecuta como servicio en background):

1. **Ollama**: `ollama serve` (o el servicio de tu sistema).
2. **Servicio FastAPI (IA)**: `cd backend/llmapi && ./run.sh`
3. **API Gateway (Node.js)**: `cd backend && npm run dev`
4. **Frontend (React)**: `cd frontend && npm run dev`

Abre en tu navegador la URL: **[http://localhost:5173](http://localhost:5173)** y ¡disfruta de Genesis!

> [!WARNING]
> Si experimentas timeouts al generar código (especialmente con diagramas complejos o modelos mayores a 14B), asegúrate de incrementar `REQUEST_TIMEOUT` en Node.js y `OLLAMA_TIMEOUT` en FastAPI.
