import { logger } from '../utils/logger.js';

/**
 * Middleware para manejo de errores global
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Error handler:', err);

  // Error de multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        details: err.message,
      });
    }
    return res.status(400).json({
      error: 'Error al procesar el archivo',
      details: err.message,
    });
  }

  // Error de validación
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message || 'Petición inválida',
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
};
