import { ollamaService } from '../services/ollama.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controlador para operaciones con modelos de Ollama
 */
export class ModelsController {
  /**
   * Lista todos los modelos disponibles
   * GET /api/models
   */
  async listModels(req, res) {
    try {
      const models = await ollamaService.listModels();
      res.json(models);
    } catch (error) {
      logger.error('Error in listModels controller:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Error al obtener los modelos',
        type: error.type,
        details: error.details,
      });
    }
  }

  /**
   * Descarga un modelo de la memoria
   * POST /api/models/unload
   */
  async unloadModel(req, res) {
    try {
      const { model } = req.body;

      if (!model) {
        return res.status(400).json({
          error: 'El campo "model" es requerido',
        });
      }

      const result = await ollamaService.unloadModel(model);
      res.json(result);
    } catch (error) {
      logger.error('Error in unloadModel controller:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Error al descargar el modelo',
        type: error.type,
        details: error.details,
      });
    }
  }
}

export const modelsController = new ModelsController();
