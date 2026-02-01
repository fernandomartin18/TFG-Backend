import { query } from '../config/database.js';

/**
 * Obtener imágenes de un mensaje
 */
export const getImagesByMessageId = async (messageId) => {
  const result = await query(
    `SELECT id, message_id, original_filename, 
            image_data, mime_type, file_size, image_order, created_at 
     FROM message_images 
     WHERE message_id = $1 
     ORDER BY image_order ASC`,
    [messageId]
  );
  return result.rows;
};

/**
 * Obtener una imagen por ID
 */
export const getImageById = async (imageId) => {
  const result = await query(
    `SELECT id, message_id, original_filename, 
            image_data, mime_type, file_size, image_order, created_at 
     FROM message_images 
     WHERE id = $1`,
    [imageId]
  );
  return result.rows[0];
};

/**
 * Crear un registro de imagen
 */
export const createImage = async ({
  messageId,
  originalFilename,
  imageData,
  mimeType,
  fileSize,
  imageOrder,
}) => {
  const result = await query(
    `INSERT INTO message_images 
     (message_id, original_filename, image_data, mime_type, file_size, image_order) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, message_id, original_filename, 
               image_data, mime_type, file_size, image_order, created_at`,
    [messageId, originalFilename, imageData, mimeType, fileSize, imageOrder]
  );
  return result.rows[0];
};

/**
 * Eliminar una imagen
 */
export const deleteImage = async (imageId) => {
  const result = await query(
    'DELETE FROM message_images WHERE id = $1 RETURNING id',
    [imageId]
  );
  return result.rows[0];
};

/**
 * Eliminar todas las imágenes de un mensaje
 */
export const deleteImagesByMessage = async (messageId) => {
  const result = await query(
    'DELETE FROM message_images WHERE message_id = $1 RETURNING id',
    [messageId]
  );
  return result.rows;
};

/**
 * Contar imágenes de un mensaje
 */
export const countImagesByMessageId = async (messageId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM message_images WHERE message_id = $1',
    [messageId]
  );
  return parseInt(result.rows[0].count);
};
