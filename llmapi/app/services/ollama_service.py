import requests
import base64
import re
from typing import Dict, Any, Optional, List
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
    image_bytes_list: Optional[List[bytes]] = None
) -> Dict[str, Any]:
    """
    Genera una respuesta desde Ollama, opcionalmente incluyendo múltiples imágenes.
    
    Args:
        model: Nombre del modelo Ollama a usar
        prompt: Texto del prompt para la generación
        image_bytes_list: Lista opcional de datos de imagen como bytes
        
    Returns:
        Diccionario conteniendo la respuesta de generación
    """
    messages = [{"role": "user", "content": prompt}]
    
    if image_bytes_list and len(image_bytes_list) > 0:
        try:
            images_b64 = []
            for image_bytes in image_bytes_list:
                img_b64 = base64.b64encode(image_bytes).decode("utf-8")
                images_b64.append(img_b64)
            
            messages[0]["images"] = images_b64
            logger.info(f"{len(image_bytes_list)} imágenes codificadas")
        except Exception as e:
            logger.error(f"Fallo al codificar imágenes: {str(e)}")
            raise ValueError(f"Error codificando imágenes: {str(e)}")

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    
    return _call_ollama(payload)


def generate_with_image_stream(
    model: str, 
    prompt: str, 
    image_bytes_list: Optional[List[bytes]] = None,
    message_history: Optional[list] = None
):
    """
    Genera una respuesta desde Ollama con streaming, opcionalmente incluyendo múltiples imágenes.
    
    Args:
        model: Nombre del modelo Ollama a usar
        prompt: Texto del prompt para la generación
        image_bytes_list: Lista opcional de datos de imagen como bytes
        message_history: Historial de mensajes previos para contexto
        
    Yields:
        Chunks de texto generados por el modelo
    """
    # Si hay historial de mensajes, usarlo; si no, crear uno nuevo solo con el mensaje actual
    if message_history and len(message_history) > 0:
        messages = message_history
        logger.info(f"Using message history with {len(messages)} messages")
    else:
        messages = [{"role": "user", "content": prompt}]
    
    if image_bytes_list and len(image_bytes_list) > 0:
        try:
            images_b64 = []
            for image_bytes in image_bytes_list:
                img_b64 = base64.b64encode(image_bytes).decode("utf-8")
                images_b64.append(img_b64)
            
            # Agregar las imágenes al último mensaje del usuario
            if messages:
                messages[-1]["images"] = images_b64
            logger.info(f"{len(image_bytes_list)} imágenes codificadas")
        except Exception as e:
            logger.error(f"Fallo al codificar imágenes: {str(e)}")
            raise ValueError(f"Error codificando imágenes: {str(e)}")

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


def extract_plantuml_with_vision(
    image_bytes_list: List[bytes]
) -> str:
    """
    Extrae código PlantUML de imágenes usando el modelo qwen3-vl:8b.
    
    Args:
        image_bytes_list: Lista de datos de imagen como bytes
        
    Returns:
        String con los bloques PlantUML generados o "No diagram" si no hay diagramas
    """
    plantuml_prompt = """You are an expert in understanding and designing UML diagrams of any type (e.g., class, sequence, use case, activity, state, component, deployment, etc.).
Your task is to generate accurate PlantUML code blocks from the provided images.

Output rules:

Generate one PlantUML code block per image, following the order in which the images were provided.

For each image, return exactly one complete PlantUML block starting with @startuml and ending with @enduml.

Enclose each PlantUML block inside its own Markdown code block using triple backticks (```), so that all symbols are preserved as text.

If you detect that an image is not a UML diagram, respond exclusively with:
No diagram

Include all elements exactly as shown in the diagram (classes, lifelines, states, nodes, actors, relationships, messages, transitions, etc., depending on the UML diagram type).

Represent all relationships using the correct PlantUML syntax for that particular UML diagram type.

Preserve all names, labels, visibilities, message directions, stereotypes, types, and notations exactly as they appear.

If any detail is unclear, make a reasonable UML assumption and list it at the top as a comment (' Assumption:), up to a maximum of 5.

Do not repeat any line or phrase.

Do not include any explanation or text outside the PlantUML block."""
    
    try:
        logger.info(f"Extracting PlantUML from {len(image_bytes_list)} images using qwen3-vl:8b")
        
        # Codificar imágenes en base64
        images_b64 = []
        for image_bytes in image_bytes_list:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            images_b64.append(img_b64)
        
        messages = [{
            "role": "user",
            "content": plantuml_prompt,
            "images": images_b64
        }]
        
        payload = {
            "model": "qwen3-vl:8b",
            "messages": messages,
            "stream": False
        }
        
        resp = _call_ollama(payload)
        
        # Extraer el contenido de la respuesta
        content = ""
        if "message" in resp and isinstance(resp["message"], dict):
            content = resp["message"].get("content", "")
        elif "response" in resp:
            content = resp["response"]
        
        logger.info(f"PlantUML extraction completed, response length: {len(content)}")
        return content
        
    except Exception as e:
        logger.error(f"Error extracting PlantUML: {str(e)}")
        raise


def replace_image_references(prompt: str) -> str:
    """
    Reemplaza referencias a imágenes en el prompt con referencias a código PlantUML.
    
    Args:
        prompt: Texto original del prompt
        
    Returns:
        Prompt modificado con referencias a PlantUML
    """
    prompt = re.sub(r'\b(imagenes|imágenes|images)\b', 'PlantUML codes', prompt, flags=re.IGNORECASE)
    prompt = re.sub(r'\b(imagen|imágen|image)\b', 'PlantUML code', prompt, flags=re.IGNORECASE)
    return prompt


def generate_with_image_stream_auto(
    prompt: str,
    image_bytes_list: List[bytes],
    message_history: Optional[list] = None
):
    """
    Genera una respuesta en modo automático con dos pasos:
    1. Extrae PlantUML de las imágenes usando qwen3-vl:8b
    2. Genera la respuesta usando qwen2.5-coder:14b con los códigos PlantUML
    
    Args:
        prompt: Texto del prompt para la generación
        image_bytes_list: Lista de datos de imagen como bytes
        message_history: Historial de mensajes previos para contexto
        
    Yields:
        Chunks de texto generados por el modelo
    """
    try:
        # Paso 1: Extraer PlantUML de las imágenes
        plantuml_content = extract_plantuml_with_vision(image_bytes_list)
        
        # Paso 2: Modificar el prompt para reemplazar referencias a imágenes
        modified_prompt = replace_image_references(prompt)
        
        # Construir mensaje con códigos PlantUML
        final_prompt = f"{modified_prompt}\n\n{plantuml_content}"
        
        logger.info(f"Modified prompt created, length: {len(final_prompt)}")
        
        # Preparar mensajes para siguiente modelo
        if message_history and len(message_history) > 0:
            messages = message_history.copy()
            # Actualizar el último mensaje del usuario con el prompt modificado
            messages[-1] = {"role": "user", "content": final_prompt}
        else:
            messages = [{"role": "user", "content": final_prompt}]
        
        payload = {
            "model": "qwen2.5-coder:14b",
            "messages": messages,
            "stream": True
        }
        
        logger.info(f"Starting streaming with qwen2.5-coder:14b")
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
                    
    except Exception as e:
        logger.error(f"Error en generate_with_image_stream_auto: {str(e)}")
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
