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


def _extract_model_size(model_name: str) -> int:
    """
    Extrae el tamaño del modelo del nombre (en billones de parámetros).
    
    Args:
        model_name: Nombre del modelo (ej: "qwen3-vl:8b", "llama3:70b")
        
    Returns:
        Tamaño estimado en billones de parámetros (0 si no se puede determinar)
    """
    # Buscar patrones como :7b
    match = re.search(r':(\d+)b', model_name.lower())
    if match:
        return int(match.group(1))
    
    # Buscar patrones sin ":"
    match = re.search(r'(\d+)b', model_name.lower())
    if match:
        return int(match.group(1))
    
    return 0


def _is_vision_model(model_name: str) -> bool:
    """
    Determina si un modelo tiene capacidades de visión.
    
    Args:
        model_name: Nombre del modelo
        
    Returns:
        True si el modelo tiene capacidades de visión
    """
    vision_keywords = ['vl', 'vision', 'llava', 'bakllava', 'moondream']
    model_lower = model_name.lower()
    return any(keyword in model_lower for keyword in vision_keywords)


def _is_coding_model(model_name: str) -> bool:
    """
    Determina si un modelo está especializado en código.
    
    Args:
        model_name: Nombre del modelo
        
    Returns:
        True si el modelo está especializado en código
    """
    coding_keywords = ['coder', 'code', 'codellama', 'starcoder', 'deepseek-coder']
    model_lower = model_name.lower()
    return any(keyword in model_lower for keyword in coding_keywords)


def select_best_models() -> Optional[Dict[str, str]]:
    """
    Selecciona automáticamente los mejores modelos disponibles para el modo auto.
    
    Returns:
        Diccionario con 'vision_model' y 'coding_model', o None si no hay modelos suficientes
    """
    try:
        models_data = list_models()
        if "error" in models_data or "models" not in models_data:
            logger.error("No se pudieron obtener los modelos disponibles")
            return None
        
        models = models_data.get("models", [])
        
        if not models:
            logger.warning("No hay modelos disponibles")
            return None
        
        # Filtrar modelos con visión
        vision_models = [m for m in models if _is_vision_model(m.get("name", ""))]
        
        # Filtrar modelos sin visión
        coding_models = [m for m in models if _is_coding_model(m.get("name", ""))]
        non_vision_models = [m for m in models if not _is_vision_model(m.get("name", ""))]
        
        # Seleccionar el mejor modelo de visión
        best_vision = None
        if vision_models:
            best_vision = max(vision_models, key=lambda m: _extract_model_size(m.get("name", "")))
        
        # Seleccionar el mejor modelo de código
        best_coding = None
        if coding_models:
            best_coding = max(coding_models, key=lambda m: _extract_model_size(m.get("name", "")))
        elif non_vision_models:
            # Si no hay modelo de código específico, usar el más grande que no sea de visión
            best_coding = max(non_vision_models, key=lambda m: _extract_model_size(m.get("name", "")))
        
        # Verificar que hay ambos tipos de modelos
        if not best_vision or not best_coding:
            logger.warning(f"Modelos insuficientes para modo auto: vision={bool(best_vision)}, coding={bool(best_coding)}")
            return None
        
        vision_model_name = best_vision.get("name", "")
        coding_model_name = best_coding.get("name", "")
        
        logger.info(f"Modelos seleccionados automáticamente: vision={vision_model_name}, coding={coding_model_name}")
        
        return {
            "vision_model": vision_model_name,
            "coding_model": coding_model_name
        }
        
    except Exception as e:
        logger.error(f"Error seleccionando modelos: {str(e)}")
        return None


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
    image_bytes_list: List[bytes],
    vision_model: Optional[str] = None
) -> str:
    """
    Extrae código PlantUML de imágenes usando un modelo con capacidades de visión.
    
    Args:
        image_bytes_list: Lista de datos de imagen como bytes
        vision_model: Nombre del modelo de visión a usar (si None, se selecciona automáticamente)
        
    Returns:
        String con los bloques PlantUML generados
        
    Raises:
        ValueError: Si todas las imágenes no son diagramas UML
    """
    # Seleccionar modelo si no se especifica
    if not vision_model:
        best_models = select_best_models()
        vision_model = best_models["vision_model"]
    
    plantuml_prompt = """You are an expert in interpreting UML diagrams and generating precise PlantUML code.

Your task: From each provided image, output ONLY one PlantUML code block, or the phrase "No diagram".

STRICT OUTPUT RULES (MUST FOLLOW):

1. For each image, output EXACTLY ONE of the following:
   a) A complete PlantUML block:
      - Starts with: @startuml
      - Ends with: @enduml
      - Wrapped in a Markdown code block using triple backticks (```).
   b) OR, if the image is not a UML diagram:
      - Output ONLY the exact text: No diagram

2. OUTSIDE the code block:
   - DO NOT output explanations.
   - DO NOT output descriptions.
   - DO NOT output reasoning.
   - DO NOT output apologies.
   - DO NOT output summaries.
   - DO NOT output transitions.
   - DO NOT output commentary.
   - DO NOT output anything except either the code block or "No diagram".

3. Inside the code block:
   - Include every UML element visible in the image (classes, actors, lifelines, messages, states, components, etc.).
   - Preserve all names, labels, visibilities, stereotypes, and notation exactly as they appear.
   - Use correct PlantUML syntax for the detected diagram type.
   - If *and only if* something is unclear, add at the TOP of the code block up to 5 lines starting with:
        ' Assumption:
     (These comments MUST stay inside the code block.)

4. NEVER:
   - Never add text before or after the code block.
   - Never explain decisions.
   - Never justify assumptions.
   - Never restate instructions.

5. Output format MUST be strictly:
   For a UML diagram:
```
@startuml
' Assumption: ...
...PlantUML content...
@enduml
```

OR, for a non-diagram:
No diagram"""
    
    try:
        logger.info(f"Extracting PlantUML from {len(image_bytes_list)} images using {vision_model}")
        
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
            "model": vision_model,
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
        
        # Verificar si todas las imágenes resultaron en "No diagram"
        # Contar cuántas veces aparece "No diagram" en la respuesta
        no_diagram_count = content.lower().count("no diagram")
        
        # Si hay tantos "No diagram" como imágenes, significa que ninguna es un diagrama UML
        if no_diagram_count >= len(image_bytes_list) and len(image_bytes_list) > 0:
            logger.warning(f"All {len(image_bytes_list)} images were identified as non-UML diagrams")
            raise ValueError("No se ha detectado ningún diagrama UML")
        
        return content
        
    except ValueError:
        # Re-lanzar ValueError para que sea capturado en el nivel superior
        raise
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
    1. Extrae PlantUML de las imágenes usando el mejor modelo con visión disponible
    2. Genera la respuesta usando el mejor modelo de código disponible con los códigos PlantUML
    
    Args:
        prompt: Texto del prompt para la generación
        image_bytes_list: Lista de datos de imagen como bytes
        message_history: Historial de mensajes previos para contexto
        
    Yields:
        Chunks de texto generados por el modelo o eventos de control
    """
    try:
        # Seleccionar los mejores modelos disponibles
        best_models = select_best_models()
        vision_model = best_models["vision_model"]
        coding_model = best_models["coding_model"]
        
        logger.info(f"Auto mode using: vision={vision_model}, coding={coding_model}")
        
        # Enviar evento de inicio del paso 1
        yield "[STEP1_START]"
        
        # Paso 1: Extraer PlantUML de las imágenes
        plantuml_content = ""
        logger.info(f"Extracting PlantUML from {len(image_bytes_list)} images using {vision_model}")
        
        # Codificar imágenes en base64
        images_b64 = []
        for image_bytes in image_bytes_list:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            images_b64.append(img_b64)
        
        messages = [{
            "role": "user",
            "content": """You are an expert in interpreting UML diagrams and generating precise PlantUML code.

Your task: From each provided image, output ONLY one PlantUML code block, or the phrase "No diagram".

STRICT OUTPUT RULES (MUST FOLLOW):

1. For each image, output EXACTLY ONE of the following:
   a) A complete PlantUML block:
      - Starts with: @startuml
      - Ends with: @enduml
      - Wrapped in a Markdown code block using triple backticks (```).
   b) OR, if the image is not a UML diagram:
      - Output ONLY the exact text: No diagram

2. OUTSIDE the code block:
   - DO NOT output explanations.
   - DO NOT output descriptions.
   - DO NOT output reasoning.
   - DO NOT output apologies.
   - DO NOT output summaries.
   - DO NOT output transitions.
   - DO NOT output commentary.
   - DO NOT output anything except either the code block or "No diagram".

3. Inside the code block:
   - Include every UML element visible in the image (classes, actors, lifelines, messages, states, components, etc.).
   - Preserve all names, labels, visibilities, stereotypes, and notation exactly as they appear.
   - Use correct PlantUML syntax for the detected diagram type.
   - If *and only if* something is unclear, add at the TOP of the code block up to 5 lines starting with:
        ' Assumption:
     (These comments MUST stay inside the code block.)

4. NEVER:
   - Never add text before or after the code block.
   - Never explain decisions.
   - Never justify assumptions.
   - Never restate instructions.

5. Output format MUST be strictly:
   For a UML diagram:
```
@startuml
' Assumption: ...
...PlantUML content...
@enduml
```

OR, for a non-diagram:
No diagram""",
            "images": images_b64
        }]
        
        payload = {
            "model": vision_model,
            "messages": messages,
            "stream": True
        }
        
        resp = requests.post(OLLAMA_CHAT_URL, json=payload, stream=True, timeout=OLLAMA_TIMEOUT)
        resp.raise_for_status()
        
        # Primero recopilar todo el contenido sin hacer stream
        for line in resp.iter_lines():
            if line:
                try:
                    import json
                    chunk = json.loads(line)
                    if "message" in chunk and "content" in chunk["message"]:
                        content = chunk["message"]["content"]
                        if content:
                            plantuml_content += content
                except json.JSONDecodeError:
                    logger.warning(f"Could not decode line: {line}")
                    continue
        
        logger.info(f"PlantUML extraction completed, response length: {len(plantuml_content)}")
        
        # Verificar si todas las imágenes resultaron en "No diagram" ANTES de enviar nada
        no_diagram_count = plantuml_content.lower().count("no diagram")
        if no_diagram_count >= len(image_bytes_list) and len(image_bytes_list) > 0:
            logger.warning(f"All {len(image_bytes_list)} images were identified as non-UML diagrams")
            raise ValueError("No se ha detectado ningún diagrama UML")
        
        # Si pasó la validación, ahora sí enviar el contenido
        yield plantuml_content
        
        # Enviar evento de fin del paso 1 e inicio del paso 2
        yield "[STEP1_END]"
        yield "[STEP2_START]"
        
        # Paso 2: Modificar el prompt para reemplazar referencias a imágenes
        modified_prompt = replace_image_references(prompt)
        
        # Extraer solo los bloques de código (entre triple backticks) del contenido PlantUML
        code_blocks = re.findall(r'```[\s\S]*?```', plantuml_content)
        filtered_plantuml = '\n\n'.join(code_blocks) if code_blocks else plantuml_content
        
        logger.info(f"Extracted {len(code_blocks)} code blocks from PlantUML content")
        
        # Añadir instrucciones para generar bloques de código separados
        code_generation_instructions = """

IMPORTANT: When generating code from the PlantUML:
- Create a SEPARATE code block for EACH class, interface, or main component. Each code block should be wrapped in triple backticks (```).
- RESPOND IN THE SAME LANGUAGE as the user's prompt (NOT always in English). If the user writes in Spanish, respond in Spanish. If in English, respond in English, etc."""
        
        # Construir mensaje con códigos PlantUML e instrucciones
        final_prompt = f"{modified_prompt}{code_generation_instructions}\n\n{filtered_plantuml}"
        
        logger.info(f"Modified prompt created, length: {len(final_prompt)}")
        
        # Preparar mensajes para siguiente modelo
        if message_history and len(message_history) > 0:
            messages = message_history.copy()
            # Actualizar el último mensaje del usuario con el prompt modificado
            messages[-1] = {"role": "user", "content": final_prompt}
        else:
            messages = [{"role": "user", "content": final_prompt}]
        
        payload = {
            "model": coding_model,
            "messages": messages,
            "stream": True
        }
        
        logger.info(f"Starting streaming with {coding_model}")
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
                    
    except ValueError:
        # Re-lanzar ValueError para que sea capturado en el nivel superior
        raise
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
