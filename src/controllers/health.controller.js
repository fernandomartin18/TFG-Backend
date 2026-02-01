import { testConnection } from '../config/database.js';
import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Health check del sistema
 */
export const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'checking',
        fastapi: 'checking',
      },
    };

    // Check base de datos
    try {
      await testConnection();
      health.services.database = 'ok';
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
      logger.error('Database health check failed:', error);
    }

    // Check FastAPI
    try {
      await axios.get(`${config.fastapi.url}/health`, { timeout: 5000 });
      health.services.fastapi = 'ok';
    } catch (error) {
      health.services.fastapi = 'error';
      health.status = 'degraded';
      logger.error('FastAPI health check failed:', error);
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};
