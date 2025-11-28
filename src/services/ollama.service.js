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
   * Genera código a partir de un prompt y opcionalmente múltiples imágenes
   * @param {string} model - Nombre del modelo
   * @param {string} prompt - Prompt para la generación
   * @param {Array} images - Array de objetos de imagen con buffer y mimetype
   * @returns {Promise<Object>} Respuesta con el código generado
   */
  async generateCode(model, prompt, images = []) {
    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', prompt);

      if (images.length > 0) {
        images.forEach((image, index) => {
          formData.append('images', image.buffer, {
            filename: `image${index}.png`,
            contentType: image.mimetype,
          });
        });
        logger.info(`Generating code with model: ${model}, prompt length: ${prompt.length}, ${images.length} images`);
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
   * Genera código con streaming a partir de un prompt y opcionalmente múltiples imágenes
   * @param {string} model - Nombre del modelo
   * @param {string} prompt - Prompt para la generación
   * @param {Array} images - Array de objetos de imagen con buffer y mimetype
   * @param {Array} messageHistory - Historial de mensajes para contexto (opcional)
   * @returns {Promise<Stream>} Stream de respuesta
   */
  async generateCodeStream(model, prompt, images = [], messageHistory = []) {
    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', prompt);
      
      // Agregar historial de mensajes si existe
      if (messageHistory && messageHistory.length > 0) {
        formData.append('messages', JSON.stringify(messageHistory));
      }

      if (images.length > 0) {
        images.forEach((image, index) => {
          formData.append('images', image.buffer, {
            filename: `image${index}.png`,
            contentType: image.mimetype,
          });
        });
        logger.info(`Starting streaming generation with model: ${model}, prompt length: ${prompt.length}, ${images.length} images, history: ${messageHistory.length} messages`);
      } else {
        logger.info(`Starting streaming generation with model: ${model}, prompt length: ${prompt.length}, history: ${messageHistory.length} messages`);
      }

      const response = await axios.post(`${this.baseURL}/generate/stream`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: 'stream',
      });

      return response.data;
    } catch (error) {
      logger.error('Error in streaming generation:', error.message);
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
