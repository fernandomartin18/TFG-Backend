import requests
import base64
from typing import Dict, Any, Optional
from app.core.config import (
    OLLAMA_CHAT_URL, 
    OLLAMA_TAGS_URL, 
    OLLAMA_GENERATE_URL,
    OLLAMA_TIMEOUT,
    OLLAMA_TAGS_TIMEOUT
)
from app.core.logger import logger


def _call_ollama(payload: Dict[str, Any], timeout: Optional[int] = None) -> Dict[str, Any]:
    """
    Realiza una petición POST al endpoint de chat de Ollama.
    
    Args:
        payload: Datos de la petición conteniendo modelo y mensajes
        timeout: Tiempo de espera de la petición en segundos (usa OLLAMA_TIMEOUT de config si es None)
        
    Returns:
        Respuesta JSON de Ollama
        
    Raises:
        requests.RequestException: Si la petición falla
    """
    if timeout is None:
        timeout = OLLAMA_TIMEOUT
    
    try:
        logger.info(f"Llamando a Ollama con modelo: {payload.get('model')} (timeout: {timeout}s)")
        resp = requests.post(OLLAMA_CHAT_URL, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error llamando a Ollama: {str(e)}")
        raise
    except Exception as e:
        logger.exception("Error inesperado llamando a Ollama")
        raise


def list_models() -> Dict[str, Any]:
    """
    Obtiene la lista de modelos disponibles de Ollama.
    
    Returns:
        Diccionario conteniendo información de los modelos
    """
    try:
        logger.info(f"Obteniendo modelos desde {OLLAMA_TAGS_URL}")
        resp = requests.get(OLLAMA_TAGS_URL, timeout=OLLAMA_TAGS_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Se obtuvieron exitosamente {len(data.get('models', []))} modelos")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Fallo al listar modelos: {str(e)}")
        return {"error": "No se pudo listar modelos", "detail": str(e)}
    except Exception as e:
        logger.exception("Error inesperado al listar modelos")
        return {"error": "Error inesperado al listar modelos", "detail": str(e)}


def generate_with_image(
    model: str, 
    prompt: str, 
    image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Genera una respuesta desde Ollama, opcionalmente incluyendo una imagen.
    
    Args:
        model: Nombre del modelo Ollama a usar
        prompt: Texto del prompt para la generación
        image_bytes: Datos opcionales de imagen como bytes
        
    Returns:
        Diccionario conteniendo la respuesta de generación
    """
    messages = [{"role": "user", "content": prompt}]
    
    if image_bytes:
        try:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            messages[0]["images"] = [img_b64]
            logger.info(f"Imagen codificada, tamaño: {len(image_bytes)} bytes")
        except Exception as e:
            logger.error(f"Fallo al codificar imagen: {str(e)}")
            raise ValueError(f"Error codificando imagen: {str(e)}")

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    
    return _call_ollama(payload)


def generate_with_image_stream(
    model: str, 
    prompt: str, 
    image_bytes: Optional[bytes] = None
):
    """
    Genera una respuesta desde Ollama con streaming, opcionalmente incluyendo una imagen.
    
    Args:
        model: Nombre del modelo Ollama a usar
        prompt: Texto del prompt para la generación
        image_bytes: Datos opcionales de imagen como bytes
        
    Yields:
        Chunks de texto generados por el modelo
    """
    messages = [{"role": "user", "content": prompt}]
    
    if image_bytes:
        try:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            messages[0]["images"] = [img_b64]
            logger.info(f"Imagen codificada, tamaño: {len(image_bytes)} bytes")
        except Exception as e:
            logger.error(f"Fallo al codificar imagen: {str(e)}")
            raise ValueError(f"Error codificando imagen: {str(e)}")

    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }
    
    try:
        logger.info(f"Iniciando streaming con modelo: {model}")
        resp = requests.post(OLLAMA_CHAT_URL, json=payload, stream=True, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        
        for line in resp.iter_lines():
            if line:
                try:
                    import json
                    chunk = json.loads(line)
                    if "message" in chunk and "content" in chunk["message"]:
                        content = chunk["message"]["content"]
                        if content:
                            yield content
                except json.JSONDecodeError:
                    logger.warning(f"Could not decode line: {line}")
                    continue
                    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error en streaming de Ollama: {str(e)}")
        raise
    except Exception as e:
        logger.exception("Error inesperado en streaming")
        raise


def unload_model(model: str) -> Dict[str, Any]:
    """
    Descarga un modelo de memoria para liberar recursos.
    
    Esto envía una petición a Ollama con keep_alive=0 que inmediatamente
    descarga el modelo de memoria/VRAM.
    
    Args:
        model: Nombre del modelo Ollama a descargar
        
    Returns:
        Diccionario con estado de éxito
        
    Raises:
        requests.RequestException: Si la petición falla
    """
    try:
        logger.info(f"Descargando modelo: {model}")
        
        # Enviar una petición con keep_alive=0 descarga el modelo
        payload = {
            "model": model,
            "prompt": "",  # Prompt vacío
            "keep_alive": 0  # Descargar inmediatamente
        }
        
        resp = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=30)
        resp.raise_for_status()
        
        logger.info(f"Modelo descargado exitosamente: {model}")
        return {
            "success": True,
            "message": f"Modelo {model} descargado de memoria exitosamente",
            "model": model
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Fallo al descargar modelo {model}: {str(e)}")
        return {
            "success": False,
            "error": "No se pudo descargar el modelo",
            "detail": str(e),
            "model": model
        }
    except Exception as e:
        logger.exception(f"Error inesperado al descargar modelo {model}")
        return {
            "success": False,
            "error": "Error inesperado al descargar el modelo",
            "detail": str(e),
            "model": model
        }
