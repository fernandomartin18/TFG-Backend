import express from 'express';
import * as chatsController from '../controllers/chats.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Validaciones
const createChatValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),
];

const updateChatValidation = [
  param('id').isInt().withMessage('ID de chat inválido'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 1, max: 255 })
    .withMessage('El título debe tener entre 1 y 255 caracteres'),
];

const pinChatValidation = [
  param('id').isInt().withMessage('ID de chat inválido'),
  body('pinned')
    .isBoolean()
    .withMessage('El campo pinned debe ser un booleano'),
];

const chatIdValidation = [param('id').isInt().withMessage('ID de chat inválido')];

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

/**
 * GET /api/chats
 * Obtener todos los chats del usuario autenticado
 */
router.get('/', chatsController.getUserChats);

/**
 * POST /api/chats
 * Crear un nuevo chat
 */
router.post('/', createChatValidation, handleValidationErrors, chatsController.createChat);

/**
 * GET /api/chats/:id
 * Obtener un chat específico con sus mensajes
 */
router.get('/:id', chatIdValidation, handleValidationErrors, chatsController.getChatById);

/**
 * PUT /api/chats/:id
 * Actualizar el título de un chat
 */
router.put('/:id', updateChatValidation, handleValidationErrors, chatsController.updateChat);

/**
 * PATCH /api/chats/:id/pin
 * Fijar o desfijar un chat
 */
router.patch('/:id/pin', pinChatValidation, handleValidationErrors, chatsController.togglePinChat);

/**
 * DELETE /api/chats/:id
 * Eliminar un chat
 */
router.delete('/:id', chatIdValidation, handleValidationErrors, chatsController.deleteChat);

export default router;
