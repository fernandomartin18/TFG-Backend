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

  /**
   * Genera código con streaming a partir de un prompt y opcionalmente una imagen
   * POST /api/generate/stream
   */
  async generateStream(req, res) {
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

        logger.info(`Starting streaming with image: ${image.originalname}, size: ${image.size} bytes, type: ${image.mimetype}`);
      }

      // Configurar headers para SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Llamar al servicio con streaming
      const stream = await ollamaService.generateCodeStream(
        model,
        prompt,
        image?.buffer,
        image?.mimetype
      );

      // Pipe del stream de FastAPI al cliente
      stream.pipe(res);

      // Manejar errores en el stream
      stream.on('error', (error) => {
        logger.error('Error in stream:', error);
        res.write(`data: [ERROR] ${error.message}\n\n`);
        res.end();
      });

      // Cleanup cuando el cliente cierra la conexión
      req.on('close', () => {
        logger.info('Client closed connection');
        stream.destroy();
      });

    } catch (error) {
      logger.error('Error in generateStream controller:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Error al generar código en streaming',
        type: error.type,
        details: error.details,
      });
    }
  }
}

export const generateController = new GenerateController();
