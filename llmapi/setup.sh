#!/bin/bash

# Script de instalación y configuración del backend FastAPI

echo "Instalando FastAPI..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verificar Python
echo -e "${BLUE}Verificando Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 no está instalado${NC}"
    exit 1
fi
python3 --version

# 2. Crear entorno virtual si no existe
if [ ! -d ".venv" ]; then
    echo -e "${BLUE}Creando entorno virtual...${NC}"
    python3 -m venv .venv
    echo -e "${GREEN}Entorno virtual creado${NC}"
else
    echo -e "${GREEN}Entorno virtual ya existe${NC}"
fi

# 3. Activar entorno virtual
echo -e "${BLUE}Activando entorno virtual...${NC}"
source .venv/bin/activate

# 4. Actualizar pip
echo -e "${BLUE}Actualizando pip...${NC}"
pip install --upgrade pip

# 5. Instalar dependencias
echo -e "${BLUE}Instalando dependencias...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}Dependencias instaladas${NC}"

# 6. Verificar archivo .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Archivo .env no encontrado${NC}"
    echo -e "${BLUE}Creando archivo .env desde ejemplo (Modifícalo si es necesario)...${NC}"
    cat > .env << 'EOF'
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Timeout Configuration (in seconds)
OLLAMA_TIMEOUT=600
OLLAMA_TAGS_TIMEOUT=30

# Server Configuration
HOST=0.0.0.0
PORT=8001

# CORS Configuration (comma-separated list)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
EOF
    echo -e "${GREEN}Archivo .env creado${NC}"
else
    echo -e "${GREEN}Archivo .env encontrado${NC}"
fi

echo ""
echo -e "${GREEN}¡Instalación completada!${NC}"
echo ""
echo -e "${BLUE}Para ejecutar el servidor:${NC}"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo -e "${BLUE}O usar el script de ejecución:${NC}"
echo "  ./run.sh"
