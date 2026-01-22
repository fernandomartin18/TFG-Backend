import express from 'express';
import { register, login, refresh, getProfile, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middlewares/validators.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 * 
 * Body:
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "Password123",
 *   "avatarUrl": "https://example.com/avatar.jpg" (opcional)
 * }
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  register
);

/**
 * POST /api/auth/login
 * Iniciar sesión
 * 
 * Body:
 * {
 *   "username": "johndoe",
 *   "password": "Password123"
 * }
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  login
);

/**
 * POST /api/auth/refresh
 * Renovar tokens usando refresh token
 * 
 * Body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  refresh
);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 */
router.get(
  '/profile',
  authenticate,
  getProfile
);

/**
 * POST /api/auth/logout
 * Cerrar sesión (opcional, para invalidar tokens)
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 */
router.post(
  '/logout',
  authenticate,
  logout
);

export default router;
