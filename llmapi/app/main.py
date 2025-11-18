from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ALLOWED_ORIGINS, HOST, PORT
from app.core.logger import logger
from app.routes import generate, models

app = FastAPI(
    title="Servicio IA - FastAPI (Ollama)",
    description="API para generación de código usando Ollama",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(models.router, prefix="/models", tags=["Modelos"])
app.include_router(generate.router, prefix="/generate", tags=["Generar"])

@app.get("/", tags=["Salud"])
def root():
    """Endpoint de verificación de salud"""
    return {"message": "Servicio IA FastAPI en ejecución", "status": "ok"}

@app.on_event("startup")
async def startup_event():
    logger.info("Aplicación FastAPI iniciando...")
    logger.info(f"El servidor se ejecutará en {HOST}:{PORT}")
    logger.info(f"CORS habilitado para orígenes: {ALLOWED_ORIGINS}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Aplicación FastAPI cerrándose...")

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Iniciando FastAPI en {HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
