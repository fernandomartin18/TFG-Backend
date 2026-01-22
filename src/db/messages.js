import { query } from '../config/database.js';

/**
 * Obtener todos los mensajes de un chat
 */
export const getMessagesByChatId = async (chatId) => {
  const result = await query(
    `SELECT id, chat_id, role, content, models_used, created_at 
     FROM messages 
     WHERE chat_id = $1 
     ORDER BY created_at ASC`,
    [chatId]
  );
  return result.rows;
};

/**
 * Obtener un mensaje por ID
 */
export const getMessageById = async (messageId) => {
  const result = await query(
    'SELECT id, chat_id, role, content, models_used, created_at FROM messages WHERE id = $1',
    [messageId]
  );
  return result.rows[0];
};

/**
 * Crear un nuevo mensaje
 */
export const createMessage = async ({ chatId, role, content, modelsUsed = [] }) => {
  const result = await query(
    `INSERT INTO messages (chat_id, role, content, models_used) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, chat_id, role, content, models_used, created_at`,
    [chatId, role, content, modelsUsed]
  );
  return result.rows[0];
};

/**
 * Eliminar un mensaje
 */
export const deleteMessage = async (messageId) => {
  const result = await query('DELETE FROM messages WHERE id = $1 RETURNING id', [messageId]);
  return result.rows[0];
};

/**
 * Eliminar todos los mensajes de un chat
 */
export const deleteMessagesByChat = async (chatId) => {
  const result = await query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
  return result.rowCount;
};

/**
 * Obtener el último mensaje de un chat
 */
export const getLastMessageByChatId = async (chatId) => {
  const result = await query(
    `SELECT id, chat_id, role, content, models_used, created_at 
     FROM messages 
     WHERE chat_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [chatId]
  );
  return result.rows[0];
};

/**
 * Contar mensajes en un chat
 */
export const countMessagesByChatId = async (chatId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM messages WHERE chat_id = $1',
    [chatId]
  );
  return parseInt(result.rows[0].count);
};
