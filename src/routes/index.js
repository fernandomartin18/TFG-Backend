import express from 'express';
import modelsRoutes from './models.routes.js';
import generateRoutes from './generate.routes.js';

const router = express.Router();

/**
 * Estado de la API
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TFG Backend API Gateway',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rutas de modelos
 */
router.use('/models', modelsRoutes);

/**
 * Rutas de generación
 */
router.use('/generate', generateRoutes);

export default router;
