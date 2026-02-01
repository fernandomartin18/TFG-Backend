@echo off
REM Script para ejecutar el servidor FastAPI en Windows

REM Activar entorno virtual
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo Entorno virtual no encontrado. Ejecuta setup.bat primero
    pause
    exit /b 1
)

REM Verificar que las dependencias esten instaladas
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Dependencias no instaladas. Ejecuta setup.bat primero
    pause
    exit /b 1
)

REM Ejecutar servidor
echo Iniciando servidor FastAPI...
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
