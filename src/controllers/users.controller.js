import bcrypt from 'bcrypt';
import { users } from '../db/index.js';
import { logger } from '../utils/logger.js';

/**
 * Crear un nuevo usuario
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, avatarUrl } = req.body;

    // Validación de campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['username', 'email', 'password'],
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
      });
    }

    // Validar longitud de username
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: 'El username debe tener entre 3 y 50 caracteres',
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    // Verificar si el username ya existe
    const existingUsername = await users.getUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        error: 'El username ya está en uso',
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await users.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        error: 'El email ya está registrado',
      });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const newUser = await users.createUser({
      username,
      email,
      passwordHash,
      avatarUrl: avatarUrl || null,
    });

    logger.info(`Usuario creado: ${username} (ID: ${newUser.id})`);

    // Devolver el usuario sin el hash de contraseña
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatar_url,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    
    // Manejar errores específicos de PostgreSQL
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El usuario o email ya existe',
      });
    }

    res.status(500).json({
      error: 'Error al crear el usuario',
      message: error.message,
    });
  }
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await users.getUserById(id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error al obtener el usuario',
      message: error.message,
    });
  }
};

/**
 * Obtener un usuario por username
 */
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await users.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error al obtener el usuario',
      message: error.message,
    });
  }
};
