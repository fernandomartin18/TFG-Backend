#!/bin/bash

# Script para ejecutar el servidor FastAPI

# Activar entorno virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Entorno virtual no encontrado. Ejecuta ./setup.sh primero"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Dependencias no instaladas. Ejecuta ./setup.sh primero"
    exit 1
fi

# Ejecutar servidor
echo "Iniciando servidor FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
