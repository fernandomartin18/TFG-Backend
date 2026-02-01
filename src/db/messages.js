import { query } from '../config/database.js';
import * as messageImages from './message_images.js';

/**
 * Obtener todos los mensajes de un chat
 */
export const getMessagesByChatId = async (chatId) => {
  const result = await query(
    `SELECT id, chat_id, role, content, is_error, is_collapsible, created_at 
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
    'SELECT id, chat_id, role, content, is_error, is_collapsible, created_at FROM messages WHERE id = $1',
    [messageId]
  );
  return result.rows[0];
};

/**
 * Crear un nuevo mensaje
 */
export const createMessage = async ({ chatId, role, content, isError = false, isCollapsible = false }) => {
  const result = await query(
    `INSERT INTO messages (chat_id, role, content, is_error, is_collapsible) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, chat_id, role, content, is_error, is_collapsible, created_at`,
    [chatId, role, content, isError, isCollapsible]
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
    `SELECT id, chat_id, role, content, is_error, is_collapsible, created_at 
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

/**
 * Obtener mensajes con imágenes
 */
export const getMessagesWithDetails = async (chatId) => {
  const chatMessages = await getMessagesByChatId(chatId);
  
  const messagesWithDetails = await Promise.all(
    chatMessages.map(async (message) => {
      const images = await messageImages.getImagesByMessageId(message.id);
      return {
        ...message,
        images,
      };
    })
  );
  
  return messagesWithDetails;
};
