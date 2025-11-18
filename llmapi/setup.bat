@echo off
REM Script de instalación y configuración del backend FastAPI para Windows

echo Instalando FastAPI...

REM 1. Verificar Python
echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3 no esta instalado
    pause
    exit /b 1
)
python --version

REM 2. Crear entorno virtual si no existe
if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
    echo Entorno virtual creado
) else (
    echo Entorno virtual ya existe
)

REM 3. Activar entorno virtual
echo Activando entorno virtual...
call .venv\Scripts\activate.bat

REM 4. Actualizar pip
echo Actualizando pip...
python -m pip install --upgrade pip

REM 5. Instalar dependencias
echo Instalando dependencias...
pip install -r requirements.txt
echo Dependencias instaladas

REM 6. Verificar archivo .env
if not exist ".env" (
    echo Archivo .env no encontrado
    echo Creando archivo .env desde ejemplo (Modificalo si es necesario)...
    (
        echo # Ollama Configuration
        echo OLLAMA_BASE_URL=http://localhost:11434
        echo.
        echo # Timeout Configuration (in seconds^)
        echo OLLAMA_TIMEOUT=600
        echo OLLAMA_TAGS_TIMEOUT=30
        echo.
        echo # Server Configuration
        echo HOST=0.0.0.0
        echo PORT=8001
        echo.
        echo # CORS Configuration (comma-separated list^)
        echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
        echo.
        echo # Logging
        echo LOG_LEVEL=INFO
    ) > .env
    echo Archivo .env creado
) else (
    echo Archivo .env encontrado
)

echo.
echo Instalacion completada!
echo.
echo Para ejecutar el servidor:
echo   .venv\Scripts\activate
echo   uvicorn app.main:app --reload
echo.
echo O usar el script de ejecucion:
echo   run.bat
echo.
pause
