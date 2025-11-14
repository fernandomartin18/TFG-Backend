import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Servicio para comunicarse con FastAPI (Ollama)
 */
class OllamaService {
  constructor() {
    this.baseURL = config.fastapi.url;
    this.timeout = config.fastapi.timeout;
  }

  /**
   * Lista los modelos disponibles en Ollama
   * @returns {Promise<Object>} Lista de modelos
   */
  async listModels() {
    try {
      logger.info('Fetching models from FastAPI');
      const response = await axios.get(`${this.baseURL}/models/`, {
        timeout: 30000, // 30 segundos para listar modelos
      });
      logger.info(`Successfully fetched ${response.data.models?.length || 0} models`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching models:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Genera código a partir de un prompt y opcionalmente una imagen
   * @param {string} model - Nombre del modelo
   * @param {string} prompt - Prompt para la generación
   * @param {Buffer} imageBuffer - Buffer de la imagen (opcional)
   * @param {string} imageMimeType - Tipo MIME de la imagen (opcional)
   * @returns {Promise<Object>} Respuesta con el código generado
   */
  async generateCode(model, prompt, imageBuffer = null, imageMimeType = null) {
    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', prompt);

      if (imageBuffer && imageMimeType) {
        formData.append('image', imageBuffer, {
          filename: 'image.png',
          contentType: imageMimeType,
        });
        logger.info(`Generating code with model: ${model}, prompt length: ${prompt.length}, image size: ${imageBuffer.length} bytes`);
      } else {
        logger.info(`Generating code with model: ${model}, prompt length: ${prompt.length}`);
      }

      const response = await axios.post(`${this.baseURL}/generate/`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      logger.info(`Successfully generated code, response length: ${response.data.result?.length || 0} characters`);
      return response.data;
    } catch (error) {
      logger.error('Error generating code:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Descarga un modelo de la memoria
   * @param {string} model - Nombre del modelo a descargar
   * @returns {Promise<Object>} Confirmación de descarga
   */
  async unloadModel(model) {
    try {
      logger.info(`Unloading model: ${model}`);
      const response = await axios.post(`${this.baseURL}/models/unload`, 
        { model },
        { timeout: 30000 }
      );
      logger.info(`Successfully unloaded model: ${model}`);
      return response.data;
    } catch (error) {
      logger.error(`Error unloading model ${model}:`, error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Maneja errores de axios y los transforma en errores más descriptivos
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // Error de respuesta del servidor
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || error.message;
      
      return {
        status,
        message,
        type: 'FASTAPI_ERROR',
        details: error.response.data,
      };
    } else if (error.request) {
      // Error de red (no hubo respuesta)
      return {
        status: 503,
        message: 'No se pudo conectar con el servicio FastAPI. Verifica que esté corriendo.',
        type: 'CONNECTION_ERROR',
      };
    } else {
      // Error en la configuración de la petición
      return {
        status: 500,
        message: error.message,
        type: 'REQUEST_ERROR',
      };
    }
  }
}

export const ollamaService = new OllamaService();
