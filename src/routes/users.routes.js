import express from 'express';
import {
  getUserById,
  getUserByUsername,
  updateUser,
  changePassword,
  deleteUser,
} from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';
import {
  updateUserValidation,
  changePasswordValidation,
  idParamValidation,
} from '../middlewares/validators.js';

const router = express.Router();

/**
 * GET /api/users/:id
 * Obtener un usuario por ID
 */
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  getUserById
);

/**
 * GET /api/users/username/:username
 * Obtener un usuario por username
 */
router.get('/username/:username', getUserByUsername);

/**
 * PUT /api/users/me
 * Actualizar datos del usuario autenticado
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 * 
 * Body:
 * {
 *   "username": "newusername" (opcional),
 *   "email": "newemail@example.com" (opcional),
 *   "avatarUrl": "https://example.com/new-avatar.jpg" (opcional)
 * }
 */
router.put(
  '/me',
  authenticate,
  updateUserValidation,
  handleValidationErrors,
  updateUser
);

/**
 * PUT /api/users/me/password
 * Cambiar contraseña del usuario autenticado
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 * 
 * Body:
 * {
 *   "currentPassword": "OldPassword123",
 *   "newPassword": "NewPassword123",
 *   "confirmPassword": "NewPassword123"
 * }
 */
router.put(
  '/me/password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);

/**
 * DELETE /api/users/me
 * Eliminar usuario autenticado
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 */
router.delete(
  '/me',
  authenticate,
  deleteUser
);

export default router;
