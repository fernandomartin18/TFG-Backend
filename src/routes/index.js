import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import modelsRoutes from './models.routes.js';
import generateRoutes from './generate.routes.js';
import chatsRoutes from './chats.routes.js';
import messagesRoutes from './messages.routes.js';
import projectsRoutes from './projects.routes.js';

const router = express.Router();

/**
 * Health check (con verificación de DB y servicios)
 */
router.use('/health', healthRoutes);

/**
 * Rutas de autenticación
 */
router.use('/auth', authRoutes);

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

/**
 * Rutas de chats
 */
router.use('/chats', chatsRoutes);

/**
 * Rutas de proyectos
 */
router.use('/projects', projectsRoutes);

/**
 * Rutas de mensajes (incluye rutas anidadas en chats)
 */
router.use('/', messagesRoutes);

export default router;
