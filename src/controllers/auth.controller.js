import { users } from '../db/index.js';
import { logger } from '../utils/logger.js';
import {
  comparePassword,
  hashPassword,
  generateTokens,
  verifyRefreshToken,
} from '../services/auth.service.js';

/**
 * Registro de nuevo usuario
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, avatarUrl } = req.body;

    // Verificar si el email ya existe
    const existingEmail = await users.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        error: 'El email ya está registrado',
      });
    }

    // Hashear la contraseña
    const passwordHash = await hashPassword(password);

    // Crear el usuario
    const newUser = await users.createUser({
      username,
      email,
      passwordHash,
      avatarUrl: avatarUrl || null,
    });

    // Generar tokens
    const tokens = generateTokens(newUser);

    logger.info(`Usuario registrado: ${username} (ID: ${newUser.id})`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatar_url,
        createdAt: newUser.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Error al registrar usuario:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El email ya existe',
      });
    }

    res.status(500).json({
      error: 'Error al registrar el usuario',
      message: error.message,
    });
  }
};

/**
 * Login de usuario
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Obtener el usuario con el hash de contraseña (busca por email)
    const user = await users.getUserPasswordHash(email);

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos',
      });
    }

    // Verificar la contraseña
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos',
      });
    }

    // Obtener datos completos del usuario
    const userData = await users.getUserById(user.id);

    // Generar tokens
    const tokens = generateTokens(userData);

    logger.info(`Usuario autenticado: ${userData.username} (ID: ${userData.id})`);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
      },
      ...tokens,
    });
  } catch (error) {
    logger.error('Error al iniciar sesión:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: error.message,
    });
  }
};

/**
 * Refresh token
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verificar el refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Obtener datos actualizados del usuario
    const userData = await users.getUserById(decoded.userId);

    if (!userData) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(userData);

    logger.info(`Tokens renovados para usuario: ${userData.username} (ID: ${userData.id})`);

    res.json({
      message: 'Tokens renovados exitosamente',
      ...tokens,
    });
  } catch (error) {
    logger.error('Error al renovar tokens:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expirado',
        message: 'Por favor, inicia sesión nuevamente',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Refresh token inválido',
      });
    }

    res.status(500).json({
      error: 'Error al renovar tokens',
      message: error.message,
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req, res) => {
  try {
    const userData = await users.getUserById(req.user.userId);

    if (!userData) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener el perfil',
      message: error.message,
    });
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  try {
    logger.info(`Usuario desconectado: ${req.user.username} (ID: ${req.user.userId})`);

    res.json({
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    logger.error('Error al cerrar sesión:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión',
      message: error.message,
    });
  }
};
