from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from app.services.ollama_service import generate_with_image
from app.schemas.generate_request import GenerateResponse
from app.core.logger import logger

router = APIRouter()


@router.post("/", response_model=GenerateResponse)
async def generate(
    model: str = Form(..., description="Nombre del modelo en Ollama"),
    prompt: str = Form(..., description="Texto del prompt"),
    image: Optional[UploadFile] = File(None, description="Archivo de imagen opcional")
):
    """
    Genera texto o código a partir de un prompt y opcionalmente una imagen.
    
    Args:
        model: Nombre del modelo en Ollama
        prompt: Texto del prompt para la generación
        image: Archivo de imagen opcional para análisis multimodal
        
    Returns:
        GenerateResponse con el resultado generado
        
    Raises:
        HTTPException: Si hay error en la generación
    """
    try:
        image_bytes = None
        if image:
            logger.info(f"Processing image: {image.filename}, content-type: {image.content_type}")
            image_bytes = await image.read()
            
            # Validate image size (max 10MB)
            if len(image_bytes) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400, 
                    detail="Imagen demasiado grande. Máximo 10MB"
                )
        
        logger.info(f"Generating with model: {model}, prompt length: {len(prompt)}")
        ollama_resp = generate_with_image(
            model=model, 
            prompt=prompt, 
            image_bytes=image_bytes
        )

        # Extract content from Ollama response
        content = _extract_content(ollama_resp)
        
        if not content:
            logger.warning("Empty response from Ollama")
            raise HTTPException(
                status_code=500, 
                detail="Respuesta vacía del modelo"
            )
        
        logger.info(f"Successfully generated {len(content)} characters")
        return GenerateResponse(result=content)
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error en /generate")
        raise HTTPException(
            status_code=500, 
            detail=f"Error generando respuesta: {str(e)}"
        )


def _extract_content(ollama_resp: dict) -> str:
    """
    Extrae el contenido de la respuesta de Ollama.
    Maneja diferentes formatos de respuesta.
    
    Args:
        ollama_resp: Respuesta JSON de Ollama
        
    Returns:
        Contenido extraído como string
    """
    if not isinstance(ollama_resp, dict):
        return str(ollama_resp)
    
    # Formato 1: {"message": {"content": "..."}}
    if "message" in ollama_resp and isinstance(ollama_resp["message"], dict):
        content = ollama_resp["message"].get("content")
        if content:
            return content
    
    # Formato 2: {"choices": [{"message": {"content": "..."}}]}
    if "choices" in ollama_resp and isinstance(ollama_resp["choices"], list):
        if ollama_resp["choices"]:
            choice = ollama_resp["choices"][0]
            if isinstance(choice.get("message"), dict):
                content = choice["message"].get("content")
                if content:
                    return content
            elif "content" in choice:
                return choice["content"]
    
    # Formato 3: {"response": "..."}
    if "response" in ollama_resp:
        return ollama_resp["response"]
    
    # Fallback: stringify whole response
    logger.warning(f"Unknown response format: {ollama_resp.keys()}")
    return str(ollama_resp)
