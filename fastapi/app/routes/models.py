from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from app.services.ollama_service import list_models
from app.core.logger import logger

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
def get_models():
    """
    Devuelve la lista de modelos disponibles en Ollama.
    
    Returns:
        Dictionary con la lista de modelos disponibles
        
    Raises:
        HTTPException: Si hay error al obtener los modelos
    """
    try:
        models_data = list_models()
        
        if "error" in models_data:
            logger.error(f"Error fetching models: {models_data.get('error')}")
            raise HTTPException(
                status_code=503,
                detail=models_data.get("error", "No se pudo conectar con Ollama")
            )
        
        return models_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in /models")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener modelos: {str(e)}"
        )
