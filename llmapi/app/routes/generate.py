from typing import Optional, List
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.services.ollama_service import generate_with_image, generate_with_image_stream, generate_with_image_stream_auto
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


@router.post("/stream")
async def generate_stream(
    model: str = Form(..., description="Nombre del modelo en Ollama"),
    prompt: str = Form(..., description="Texto del prompt"),
    messages: Optional[str] = Form(None, description="Historial de mensajes en formato JSON"),
    images: Optional[List[UploadFile]] = File(None, description="Archivos de imagen opcionales (hasta 5)"),
    auto_mode: Optional[str] = Form("false", description="Si está en modo automático")
):
    """
    Genera texto en streaming, mostrando la respuesta a medida que se genera.
    En modo automático con imágenes, primero extrae PlantUML y luego genera con qwen2.5-coder:14b.
    
    Args:
        model: Nombre del modelo en Ollama
        prompt: Texto del prompt para la generación
        messages: Historial de mensajes en formato JSON
        images: Lista de archivos de imagen opcionales para análisis multimodal
        auto_mode: Si está en modo automático ("true" o "false")
        
    Returns:
        StreamingResponse con chunks de texto
    """
    try:
        image_bytes_list = []
        if images:
            # Validar límite de imágenes
            if len(images) > 5:
                raise HTTPException(
                    status_code=400,
                    detail="Máximo 5 imágenes permitidas"
                )
            
            for image in images:
                logger.info(f"Processing image: {image.filename}, content-type: {image.content_type}")
                image_bytes = await image.read()
                
                # Validate image size (max 10MB)
                if len(image_bytes) > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Imagen {image.filename} demasiado grande. Máximo 10MB"
                    )
                
                image_bytes_list.append(image_bytes)
        
        logger.info(f"Starting streaming with model: {model}, prompt length: {len(prompt)}, {len(image_bytes_list)} images, auto_mode: {auto_mode}")
        
        # Parsear el historial de mensajes si está presente
        message_history = []
        if messages:
            try:
                import json
                message_history = json.loads(messages)
                logger.info(f"Received message history with {len(message_history)} messages")
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing message history: {str(e)}")
        
        # Check if auto mode with images should use two-step process
        is_auto_with_images = auto_mode.lower() == "true" and len(image_bytes_list) > 0
        
        def event_generator():
            try:
                import json
                
                if is_auto_with_images:
                    # Proceso en dos pasos: extracción de PlantUML y luego generación de código
                    logger.info("Using two-step auto mode with PlantUML extraction")
                    try:
                        for chunk in generate_with_image_stream_auto(
                            prompt=prompt,
                            image_bytes_list=image_bytes_list,
                            message_history=message_history
                        ):
                            # Codificar en JSON para preservar caracteres especiales y saltos de línea
                            yield f"data: {json.dumps(chunk)}\n\n"
                    except ValueError as ve:
                        # Error específico cuando las imágenes no son diagramas
                        logger.warning(f"No UML diagrams detected: {str(ve)}")
                        yield f"data: {json.dumps(str(ve))}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                else:
                    # Generación estándar
                    for chunk in generate_with_image_stream(
                        model=model, 
                        prompt=prompt, 
                        image_bytes_list=image_bytes_list,
                        message_history=message_history
                    ):
                        # Codificar en JSON para preservar caracteres especiales y saltos de línea
                        yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Error in stream generator: {str(e)}")
                yield f"data: [ERROR] {str(e)}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error en /generate/stream")
        raise HTTPException(
            status_code=500, 
            detail=f"Error generando respuesta en streaming: {str(e)}"
        )
