from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from app.services.ollama_service import list_models, unload_model, select_best_models
from app.schemas.generate_request import UnloadRequest, UnloadResponse
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


@router.get("/auto-select", response_model=Dict[str, Any])
def get_auto_selected_models():
    """
    Selecciona automáticamente los mejores modelos disponibles.
    Devuelve el mejor modelo con visión y el mejor modelo de código.
    
    Returns:
        Dictionary con 'auto_available' (bool) y opcionalmente 'vision_model' y 'coding_model'
        
    Raises:
        HTTPException: Si hay error al seleccionar los modelos
    """
    try:
        selected_models = select_best_models()
        
        if selected_models is None:
            logger.info("Auto mode not available: insufficient models")
            return {
                "auto_available": False
            }
        
        logger.info(f"Auto-selected models: {selected_models}")
        return {
            "auto_available": True,
            "vision_model": selected_models["vision_model"],
            "coding_model": selected_models["coding_model"]
        }
        
    except Exception as e:
        logger.exception("Unexpected error in /models/auto-select")
        raise HTTPException(
            status_code=500,
            detail=f"Error al seleccionar modelos: {str(e)}"
        )


@router.post("/unload", response_model=UnloadResponse)
def unload_model_endpoint(request: UnloadRequest):
    """
    Descarga un modelo de la memoria para liberar recursos.
    
    Cuando un modelo está cargado en Ollama, consume memoria RAM/VRAM.
    Este endpoint permite descargar el modelo cuando ya no se necesita,
    liberando recursos del sistema.
    
    Args:
        request: Objeto con el nombre del modelo a descargar
        
    Returns:
        UnloadResponse con el resultado de la operación
        
    Raises:
        HTTPException: Si hay error al descargar el modelo
    """
    try:
        logger.info(f"Request to unload model: {request.model}")
        result = unload_model(request.model)
        
        if not result.get("success"):
            logger.error(f"Failed to unload model: {result.get('error')}")
            raise HTTPException(
                status_code=503,
                detail=result.get("error", "No se pudo descargar el modelo")
            )
        
        return UnloadResponse(
            success=result["success"],
            message=result["message"],
            model=result["model"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in /models/unload")
        raise HTTPException(
            status_code=500,
            detail=f"Error al descargar modelo: {str(e)}"
        )
