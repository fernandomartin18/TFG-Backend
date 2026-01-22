import { query } from '../config/database.js';

/**
 * Obtener todos los chats de un usuario
 */
export const getChatsByUserId = async (userId) => {
  const result = await query(
    `SELECT id, user_id, title, created_at, updated_at 
     FROM chats 
     WHERE user_id = $1 
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Obtener un chat por ID
 */
export const getChatById = async (chatId) => {
  const result = await query(
    'SELECT id, user_id, title, created_at, updated_at FROM chats WHERE id = $1',
    [chatId]
  );
  return result.rows[0];
};

/**
 * Crear un nuevo chat
 */
export const createChat = async (userId, title = 'Nuevo Chat') => {
  const result = await query(
    `INSERT INTO chats (user_id, title) 
     VALUES ($1, $2) 
     RETURNING id, user_id, title, created_at, updated_at`,
    [userId, title]
  );
  return result.rows[0];
};

/**
 * Actualizar el título de un chat
 */
export const updateChatTitle = async (chatId, title) => {
  const result = await query(
    `UPDATE chats 
     SET title = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING id, user_id, title, created_at, updated_at`,
    [chatId, title]
  );
  return result.rows[0];
};

/**
 * Actualizar el timestamp de un chat
 */
export const touchChat = async (chatId) => {
  const result = await query(
    `UPDATE chats 
     SET updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING id`,
    [chatId]
  );
  return result.rows[0];
};

/**
 * Eliminar un chat (cascade elimina mensajes relacionados)
 */
export const deleteChat = async (chatId) => {
  const result = await query('DELETE FROM chats WHERE id = $1 RETURNING id', [chatId]);
  return result.rows[0];
};

/**
 * Verificar si un chat pertenece a un usuario
 */
export const verifyChatOwnership = async (chatId, userId) => {
  const result = await query(
    'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
    [chatId, userId]
  );
  return result.rows.length > 0;
};
