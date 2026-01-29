import bcrypt from 'bcrypt';
import { users } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { hashPassword, comparePassword } from '../services/auth.service.js';

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
        error: 'El email ya existe',
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

/**
 * Actualizar datos del usuario autenticado
 */
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email, avatarUrl } = req.body;

    // Verificar si hay algo que actualizar
    if (!username && !email && !avatarUrl) {
      return res.status(400).json({
        error: 'No se proporcionaron datos para actualizar',
      });
    }

    // Si se intenta actualizar el email, verificar que no esté en uso
    if (email) {
      const existingEmail = await users.getUserByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({
          error: 'El email ya está registrado',
        });
      }
    }

    // Actualizar el usuario
    const updatedUser = await users.updateUser(userId, {
      username,
      email,
      avatarUrl,
    });

    if (!updatedUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    logger.info(`Usuario actualizado: ${updatedUser.username} (ID: ${userId})`);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatar_url,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El email ya existe',
      });
    }

    res.status(500).json({
      error: 'Error al actualizar el usuario',
      message: error.message,
    });
  }
};

/**
 * Cambiar contraseña del usuario autenticado
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Obtener el hash de contraseña actual por ID
    const userData = await users.getUserPasswordHashById(userId);

    if (!userData) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    // Verificar la contraseña actual
    const isValidPassword = await comparePassword(currentPassword, userData.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'La contraseña actual es incorrecta',
      });
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await comparePassword(newPassword, userData.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'La nueva contraseña debe ser diferente a la actual',
      });
    }

    // Hashear la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // Actualizar la contraseña
    await users.updateUserPassword(userId, newPasswordHash);

    logger.info(`Contraseña cambiada para usuario ID: ${userId}`);

    res.json({
      message: 'Contraseña cambiada exitosamente',
    });
  } catch (error) {
    logger.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar la contraseña',
      message: error.message,
    });
  }
};

/**
 * Eliminar usuario autenticado
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deletedUser = await users.deleteUser(userId);

    if (!deletedUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    logger.info(`Usuario eliminado: ${req.user.username} (ID: ${userId})`);

    res.json({
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error al eliminar el usuario',
      message: error.message,
    });
  }
};

