from dotenv import load_dotenv
import os

load_dotenv()

# Configuración de Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"

# Timeout en segundos
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", 600))  # 10 minutes por defecto
OLLAMA_TAGS_TIMEOUT = int(os.getenv("OLLAMA_TAGS_TIMEOUT", 30))  # Para listar modelos

# Configuración del servidor
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8001))

# CConfiguración de CORS
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]
