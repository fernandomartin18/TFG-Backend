import { query } from '../config/database.js';

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (id) => {
  const result = await query(
    'SELECT id, username, email, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

/**
 * Obtener un usuario por username
 */
export const getUserByUsername = async (username) => {
  const result = await query(
    'SELECT id, username, email, avatar_url, created_at, updated_at FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

/**
 * Obtener un usuario por email
 */
export const getUserByEmail = async (email) => {
  const result = await query(
    'SELECT id, username, email, avatar_url, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async ({ username, email, passwordHash, avatarUrl = null }) => {
  const result = await query(
    `INSERT INTO users (username, email, password_hash, avatar_url) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, username, email, avatar_url, created_at, updated_at`,
    [username, email, passwordHash, avatarUrl]
  );
  return result.rows[0];
};

/**
 * Actualizar un usuario
 */
export const updateUser = async (id, updates) => {
  const { username, email, avatarUrl } = updates;
  const result = await query(
    `UPDATE users 
     SET username = COALESCE($2, username),
         email = COALESCE($3, email),
         avatar_url = COALESCE($4, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, username, email, avatar_url, created_at, updated_at`,
    [id, username, email, avatarUrl]
  );
  return result.rows[0];
};

/**
 * Actualizar contraseña de usuario
 */
export const updateUserPassword = async (id, passwordHash) => {
  const result = await query(
    `UPDATE users 
     SET password_hash = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0];
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (id) => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

/**
 * Obtener el hash de contraseña de un usuario (para autenticación)
 * Busca por email
 */
export const getUserPasswordHash = async (email) => {
  const result = await query(
    'SELECT id, password_hash FROM users WHERE  email = $1',
    [email]
  );
  return result.rows[0];
};

/**
 * Obtener el hash de contraseña de un usuario por ID
 */
export const getUserPasswordHashById = async (id) => {
  const result = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};
