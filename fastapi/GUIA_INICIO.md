# 🚀 Guía Rápida de Inicio

## ¿Qué hace el servidor al arrancarse?

### Al iniciar el servidor FastAPI:

```
┌─────────────────────────────────────────────┐
│  1. Carga la configuración (.env)          │
│  2. Inicializa FastAPI                     │
│  3. Configura CORS                         │
│  4. Registra los endpoints                 │
│  5. Imprime logs de inicio                 │
│  6. Espera peticiones HTTP                 │
└─────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** El servidor **NO se conecta a Ollama** al iniciar.
Solo se conecta cuando alguien llama a los endpoints `/models/` o `/generate/`.

---

## 🎯 3 Opciones para Iniciar

### Opción 1: Inicio Automático (RECOMENDADO) 🌟

```bash
./start.sh
```

**¿Qué hace?**
- ✅ Verifica que Ollama esté instalado
- ✅ Inicia Ollama si no está corriendo
- ✅ Verifica modelos instalados
- ✅ Te pregunta si quieres descargar un modelo (si no tienes)
- ✅ Arranca el servidor FastAPI

---

### Opción 2: Inicio Manual Completo

**Paso 1 - Iniciar Ollama:**
```bash
# Opción A: En primer plano (verás logs)
ollama serve

# Opción B: Como servicio (segundo plano, macOS)
brew services start ollama
```

**Paso 2 - (Opcional) Instalar un modelo:**
```bash
# Para análisis de diagramas + código (multimodal)
ollama pull qwen2-vl

# Solo para código (más rápido)
ollama pull codellama
```

**Paso 3 - Arrancar servidor:**
```bash
./run.sh
```

---

### Opción 3: Solo Servidor (sin Ollama)

```bash
./run.sh
```

**Funcionará:**
- ✅ `GET /` → Health check
- ✅ `GET /docs` → Documentación Swagger

**NO funcionará:**
- ❌ `GET /models/` → Error 503
- ❌ `POST /generate/` → Error 503

---

## 🔍 Verificar Estado Actual

### Verificar Ollama:
```bash
./check_ollama.sh
```

Muestra:
- ✅/❌ Si Ollama está instalado
- ✅/❌ Si Ollama está corriendo
- 📦 Modelos instalados
- 💡 Sugerencias de modelos

### Verificar Servidor:
```bash
# Una vez iniciado, desde otra terminal:
curl http://localhost:8001/
```

---

## 📊 Flujo de Ejecución

```
Usuario hace request → FastAPI → Ollama → Respuesta
                          ↓
                    ¿Ollama corriendo?
                          ↓
                   Sí          No
                    ↓           ↓
              Responde      Error 503
```

---

## 🧪 Probar sin Ollama

Si solo quieres probar que el servidor FastAPI funciona:

```bash
# Terminal 1: Arrancar servidor
./run.sh

# Terminal 2: Probar health check
curl http://localhost:8001/

# Resultado esperado:
# {"message":"FastAPI IA service running","status":"ok"}
```

---

## 🎓 Ejemplo Completo de Uso

```bash
# 1. Verificar estado
./check_ollama.sh

# 2. Si Ollama no está corriendo, iniciarlo
ollama serve  # o: brew services start ollama

# 3. (Primera vez) Instalar un modelo
ollama pull qwen2-vl

# 4. Arrancar servidor
./start.sh

# 5. Probar endpoints (en otra terminal)
# Health check
curl http://localhost:8001/

# Listar modelos
curl http://localhost:8001/models/

# Generar código
curl -X POST "http://localhost:8001/generate/" \
  -F "model=qwen2-vl" \
  -F "prompt=Crea una clase Python para gestionar usuarios"
```

---

## 🛑 Detener Todo

```bash
# Detener servidor FastAPI
Ctrl + C  (en la terminal del servidor)

# Detener Ollama (si se inició como servicio)
brew services stop ollama

# Detener Ollama (si se inició con ollama serve)
Ctrl + C  (en la terminal de Ollama)
```

---

## 💡 Recomendación

**Para desarrollo:**
1. Usa `./start.sh` → lo hace todo automáticamente
2. Abre http://localhost:8001/docs → Documentación interactiva
3. Prueba los endpoints desde Swagger UI

**Para producción:**
- Inicia Ollama como servicio: `brew services start ollama`
- Usa un gestor de procesos como `systemd` o `supervisor` para FastAPI
