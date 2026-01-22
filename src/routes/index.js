import express from 'express';
import healthRoutes from './health.routes.js';
import usersRoutes from './users.routes.js';
import modelsRoutes from './models.routes.js';
import generateRoutes from './generate.routes.js';

const router = express.Router();

/**
 * Health check (con verificación de DB y servicios)
 */
router.use('/health', healthRoutes);

/**
 * Rutas de usuarios
 */
router.use('/users', usersRoutes);

/**
 * Rutas de modelos
 */
router.use('/models', modelsRoutes);

/**
 * Rutas de generación
 */
router.use('/generate', generateRoutes);

export default router;
