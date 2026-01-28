import express from 'express';
import * as codesController from '../controllers/codes.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Validaciones
const createCodeValidation = [
  param('messageId').isInt().withMessage('ID de mensaje inválido'),
  body('modelUsed').trim().notEmpty().withMessage('El modelo usado es requerido'),
  body('codeContent').trim().notEmpty().withMessage('El contenido del código es requerido'),
  body('language').trim().notEmpty().withMessage('El lenguaje es requerido'),
  body('filename').trim().notEmpty().withMessage('El nombre del archivo es requerido'),
  body('filePath').optional().trim(),
  body('fileSize').optional().isInt({ min: 0 }).withMessage('El tamaño debe ser un entero positivo'),
  body('isZip').optional().isBoolean().withMessage('isZip debe ser booleano'),
  body('codeOrder')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El orden del código debe ser un entero positivo'),
];

const codeIdValidation = [param('id').isInt().withMessage('ID de código inválido')];

const messageIdValidation = [param('messageId').isInt().withMessage('ID de mensaje inválido')];

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

/**
 * GET /api/messages/:messageId/codes
 * Obtener todos los códigos generados de un mensaje
 */
router.get(
  '/messages/:messageId/codes',
  messageIdValidation,
  handleValidationErrors,
  codesController.getCodesByMessageId
);

/**
 * POST /api/messages/:messageId/codes
 * Crear un nuevo código generado
 */
router.post(
  '/messages/:messageId/codes',
  createCodeValidation,
  handleValidationErrors,
  codesController.createCode
);

/**
 * GET /api/codes/:id
 * Obtener un código específico
 */
router.get('/codes/:id', codeIdValidation, handleValidationErrors, codesController.getCodeById);

/**
 * POST /api/codes/:id/download
 * Incrementar contador de descargas de un código
 */
router.post(
  '/codes/:id/download',
  codeIdValidation,
  handleValidationErrors,
  codesController.downloadCode
);

/**
 * DELETE /api/codes/:id
 * Eliminar un código generado
 */
router.delete(
  '/codes/:id',
  codeIdValidation,
  handleValidationErrors,
  codesController.deleteCode
);

export default router;
