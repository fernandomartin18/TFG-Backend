import { verifyAccessToken, extractTokenFromHeader } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware de autenticación con JWT
 * Verifica que el usuario esté autenticado con un token válido
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación',
        message: 'Se requiere autenticación para acceder a este recurso',
      });
    }

    // Verificar el token
    const decoded = verifyAccessToken(token);
    
    // Agregar la información del usuario al request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error) {
    logger.error('Error en autenticación:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido',
      });
    }

    res.status(401).json({
      error: 'Error de autenticación',
      message: error.message,
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Si hay token lo verifica, pero no falla si no hay
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      };
    }
    
    next();
  } catch (error) {
    // Si hay error, simplemente continúa sin usuario autenticado
    logger.debug('Token inválido en autenticación opcional');
    next();
  }
};
