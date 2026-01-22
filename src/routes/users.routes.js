import express from 'express';
import { createUser, getUserById, getUserByUsername } from '../controllers/users.controller.js';

const router = express.Router();

/**
 * POST /api/users
 * Crear un nuevo usuario
 * 
 * Body:
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "password123",
 *   "avatarUrl": "https://example.com/avatar.jpg" (opcional)
 * }
 */
router.post('/', createUser);

/**
 * GET /api/users/:id
 * Obtener un usuario por ID
 */
router.get('/:id', getUserById);

/**
 * GET /api/users/username/:username
 * Obtener un usuario por username
 */
router.get('/username/:username', getUserByUsername);

export default router;
