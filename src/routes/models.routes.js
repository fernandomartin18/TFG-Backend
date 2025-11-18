import express from 'express';
import { modelsController } from '../controllers/models.controller.js';

const router = express.Router();

/**
 * @route   GET /api/models
 * @desc    Lista todos los modelos disponibles en Ollama
 * @access  Public
 */
router.get('/', modelsController.listModels.bind(modelsController));

/**
 * @route   POST /api/models/unload
 * @desc    Descarga un modelo de la memoria
 * @access  Public
 */
router.post('/unload', modelsController.unloadModel.bind(modelsController));

export default router;
