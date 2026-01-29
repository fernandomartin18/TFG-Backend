import express from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Validaciones
const createMessageValidation = [
  param('chatId').isInt().withMessage('ID de chat inválido'),
  body('role')
    .notEmpty()
    .withMessage('El rol es requerido')
    .isIn(['user', 'assistant'])
    .withMessage('El rol debe ser "user" o "assistant"'),
  body('content').trim().notEmpty().withMessage('El contenido es requerido'),
  body('modelsUsed')
    .optional()
    .isArray()
    .withMessage('modelsUsed debe ser un array de strings'),
];

const messageIdValidation = [param('id').isInt().withMessage('ID de mensaje inválido')];

const chatIdValidation = [param('chatId').isInt().withMessage('ID de chat inválido')];

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

/**
 * GET /api/chats/:chatId/messages
 * Obtener todos los mensajes de un chat
 */
router.get(
  '/chats/:chatId/messages',
  chatIdValidation,
  handleValidationErrors,
  messagesController.getMessagesByChatId
);

/**
 * POST /api/chats/:chatId/messages
 * Crear un nuevo mensaje en un chat
 */
router.post(
  '/chats/:chatId/messages',
  createMessageValidation,
  handleValidationErrors,
  messagesController.createMessage
);

/**
 * GET /api/messages/:id
 * Obtener un mensaje específico con todos sus detalles
 */
router.get(
  '/messages/:id',
  messageIdValidation,
  handleValidationErrors,
  messagesController.getMessageById
);

/**
 * DELETE /api/messages/:id
 * Eliminar un mensaje
 */
router.delete(
  '/messages/:id',
  messageIdValidation,
  handleValidationErrors,
  messagesController.deleteMessage
);

export default router;
