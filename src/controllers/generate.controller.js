import { ollamaService } from '../services/ollama.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Controlador para generación de código
 */
export class GenerateController {
  /**
   * Genera código a partir de un prompt y opcionalmente una imagen
   * POST /api/generate
   */
  async generate(req, res) {
    try {
      const { model, prompt } = req.body;
      const image = req.file;

      // Validación de campos requeridos
      if (!model || !prompt) {
        return res.status(400).json({
          error: 'Los campos "model" y "prompt" son requeridos',
        });
      }

      // Validación de imagen si se proporciona
      if (image) {
        // Verificar tipo MIME
        if (!config.upload.allowedMimeTypes.includes(image.mimetype)) {
          return res.status(400).json({
            error: `Tipo de imagen no permitido. Tipos aceptados: ${config.upload.allowedMimeTypes.join(', ')}`,
          });
        }

        // Verificar tamaño
        if (image.size > config.upload.maxSize) {
          return res.status(400).json({
            error: `Imagen demasiado grande. Tamaño máximo: ${config.upload.maxSize / 1024 / 1024}MB`,
          });
        }

        logger.info(`Generating with image: ${image.originalname}, size: ${image.size} bytes, type: ${image.mimetype}`);
      }

      // Llamar al servicio
      const result = await ollamaService.generateCode(
        model,
        prompt,
        image?.buffer,
        image?.mimetype
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in generate controller:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Error al generar código',
        type: error.type,
        details: error.details,
      });
    }
  }
}

export const generateController = new GenerateController();
