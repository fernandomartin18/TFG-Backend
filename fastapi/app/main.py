from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ALLOWED_ORIGINS, HOST, PORT
from app.core.logger import logger
from app.routes import generate, models

app = FastAPI(
    title="IA Service - FastAPI (Ollama)",
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

# Include routers
app.include_router(models.router, prefix="/models", tags=["Models"])
app.include_router(generate.router, prefix="/generate", tags=["Generate"])

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint"""
    return {"message": "FastAPI IA service running", "status": "ok"}

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI application starting...")
    logger.info(f"Server will run on {HOST}:{PORT}")
    logger.info(f"CORS enabled for origins: {ALLOWED_ORIGINS}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("FastAPI application shutting down...")

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting FastAPI on {HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
