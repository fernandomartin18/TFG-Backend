# FastAPI - Ollama Integration

API REST para generación de código usando modelos de IA locales con Ollama.

## 🚀 Inicio Rápido

### Instalación

```bash
# Dar permisos de ejecución a los scripts
chmod +x setup.sh run.sh

# Ejecutar instalación
./setup.sh
```

### Ejecución

```bash
# Opción 1: Usar el script
./run.sh

# Opción 2: Manual
source .venv/bin/activate
uvicorn app.main:app --reload
```

El servidor estará disponible en: **http://localhost:8001**

## 📋 Prerequisitos

1. **Python 3.10+**
2. **Ollama** instalado y ejecutándose
   ```bash
   # Instalar Ollama
   # macOS/Linux: https://ollama.ai
   
   # Descargar un modelo
   ollama pull qwen2-vl
   
   # Verificar que Ollama esté corriendo
   ollama list
   ```

## 🏗️ Estructura del Proyecto

```
fastapi/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada
│   ├── core/
│   │   ├── config.py           # Configuración y variables de entorno
│   │   └── logger.py           # Sistema de logging
│   ├── routes/
│   │   ├── generate.py         # Endpoint de generación
│   │   └── models.py           # Endpoint de listado de modelos
│   ├── services/
│   │   └── ollama_service.py   # Servicio de comunicación con Ollama
│   └── schemas/
│       └── generate_request.py # Modelos Pydantic
├── .env                        # Variables de entorno
├── requirements.txt            # Dependencias Python
├── setup.sh                    # Script de instalación
└── run.sh                      # Script de ejecución
```

## 🔧 Configuración

Edita el archivo `.env`:

```env
# URL base de Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Configuración del servidor
HOST=0.0.0.0
PORT=8001

# CORS (separados por comas)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Nivel de logging
LOG_LEVEL=INFO
```

## 📡 Endpoints

### Health Check
```bash
GET /
```

### Listar Modelos
```bash
GET /models/
```

Respuesta:
```json
{
  "models": [
    {
      "name": "qwen2-vl",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 4700000000
    }
  ]
}
```

### Generar Código
```bash
POST /generate/
Content-Type: multipart/form-data

model: string (requerido)
prompt: string (requerido)
image: file (opcional)
```

Ejemplo con curl:
```bash
# Sin imagen
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen2-vl" \
  -F "prompt=Crea una clase Python para gestión de usuarios"

# Con imagen
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen2-vl" \
  -F "prompt=Analiza este diagrama UML" \
  -F "image=@diagrama.png"
```

Respuesta:
```json
{
  "result": "class UserManager:\n    def __init__(self):\n        ..."
}
```

## 🧪 Testing

```bash
# Activar entorno
source .venv/bin/activate

# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar tests (cuando estén implementados)
pytest
```

## 📝 Mejoras Implementadas

✅ **Type hints completos** - Mejor autocompletado y detección de errores
✅ **Manejo de errores robusto** - HTTPException con códigos apropiados
✅ **Logging detallado** - Trazabilidad completa de requests
✅ **Validación de entrada** - Límite de tamaño de imagen (10MB)
✅ **Documentación automática** - Swagger UI en `/docs`
✅ **CORS configurable** - Soporte para múltiples orígenes
✅ **Configuración centralizada** - Variables de entorno bien estructuradas
✅ **Compatibilidad Python 3.9+** - Usando `Optional[]` en lugar de `|`

## 🐛 Solución de Problemas

### Error: "No se ha podido resolver la importación"
```bash
# Asegúrate de tener el entorno virtual activado
source .venv/bin/activate

# Reinstala las dependencias
pip install -r requirements.txt
```

### Error: "Connection refused" al llamar a Ollama
```bash
# Verifica que Ollama esté corriendo
curl http://localhost:11434/api/tags

# Si no está corriendo, inícialo
ollama serve
```

### El servidor no inicia
```bash
# Verifica que el puerto 8001 no esté en uso
lsof -ti:8001

# Mata el proceso si es necesario
kill -9 $(lsof -ti:8001)
```

## 📚 Recursos

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Ollama](https://ollama.ai/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## 🔜 Próximos Pasos

- [ ] Implementar tests unitarios
- [ ] Añadir streaming de respuestas
- [ ] Implementar caché de respuestas
- [ ] Añadir métricas y monitoreo
- [ ] Dockerizar la aplicación
