from pydantic import BaseModel, Field
from typing import Optional


class GenerateRequest(BaseModel):
    """Request model for code generation"""
    model: str = Field(..., description="Nombre del modelo de Ollama a utilizar")
    prompt: str = Field(..., description="Prompt para la generación de código")
    image: Optional[str] = Field(None, description="Imagen en base64 (opcional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "model": "qwen2-vl",
                "prompt": "Genera una clase Python para un sistema de gestión de usuarios",
                "image": None
            }
        }


class GenerateResponse(BaseModel):
    """Response model for code generation"""
    result: str = Field(..., description="Código o texto generado por el modelo")
    
    class Config:
        json_schema_extra = {
            "example": {
                "result": "class UserManager:\n    def __init__(self):\n        self.users = []"
            }
        }


class ModelInfo(BaseModel):
    """Information about an Ollama model"""
    name: str
    modified_at: Optional[str] = None
    size: Optional[int] = None
    digest: Optional[str] = None
    
    
class ModelsResponse(BaseModel):
    """Response model for listing models"""
    models: list[ModelInfo]
