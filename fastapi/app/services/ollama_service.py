import requests
import base64
from typing import Dict, Any, Optional
from app.core.config import OLLAMA_CHAT_URL, OLLAMA_TAGS_URL
from app.core.logger import logger


def _call_ollama(payload: Dict[str, Any], timeout: int = 120) -> Dict[str, Any]:
    """
    Makes a POST request to Ollama's chat endpoint.
    
    Args:
        payload: Request payload containing model and messages
        timeout: Request timeout in seconds
        
    Returns:
        JSON response from Ollama
        
    Raises:
        requests.RequestException: If the request fails
    """
    try:
        logger.info(f"Calling Ollama with model: {payload.get('model')}")
        resp = requests.post(OLLAMA_CHAT_URL, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama: {str(e)}")
        raise
    except Exception as e:
        logger.exception("Unexpected error calling Ollama")
        raise


def list_models() -> Dict[str, Any]:
    """
    Fetches the list of available models from Ollama.
    
    Returns:
        Dictionary containing model information
    """
    try:
        logger.info(f"Fetching models from {OLLAMA_TAGS_URL}")
        resp = requests.get(OLLAMA_TAGS_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Successfully fetched {len(data.get('models', []))} models")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to list models: {str(e)}")
        return {"error": "No se pudo listar modelos", "detail": str(e)}
    except Exception as e:
        logger.exception("Unexpected error listing models")
        return {"error": "Error inesperado al listar modelos", "detail": str(e)}


def generate_with_image(
    model: str, 
    prompt: str, 
    image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Generates a response from Ollama, optionally including an image.
    
    Args:
        model: Name of the Ollama model to use
        prompt: Text prompt for generation
        image_bytes: Optional image data as bytes
        
    Returns:
        Dictionary containing the generation response
    """
    messages = [{"role": "user", "content": prompt}]
    
    if image_bytes:
        try:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            messages[0]["images"] = [img_b64]
            logger.info(f"Image encoded, size: {len(image_bytes)} bytes")
        except Exception as e:
            logger.error(f"Failed to encode image: {str(e)}")
            raise ValueError(f"Error encoding image: {str(e)}")

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    
    return _call_ollama(payload)
