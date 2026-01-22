import { query } from '../config/database.js';

/**
 * Obtener códigos generados de un mensaje
 */
export const getCodesByMessageId = async (messageId) => {
  const result = await query(
    `SELECT id, message_id, model_used, code_content, language, filename, 
            file_path, file_size, is_zip, code_order, download_count, created_at 
     FROM generated_codes 
     WHERE message_id = $1 
     ORDER BY code_order ASC`,
    [messageId]
  );
  return result.rows;
};

/**
 * Obtener un código generado por ID
 */
export const getCodeById = async (codeId) => {
  const result = await query(
    `SELECT id, message_id, model_used, code_content, language, filename, 
            file_path, file_size, is_zip, code_order, download_count, created_at 
     FROM generated_codes 
     WHERE id = $1`,
    [codeId]
  );
  return result.rows[0];
};

/**
 * Crear un registro de código generado
 */
export const createCode = async ({
  messageId,
  modelUsed,
  codeContent,
  language,
  filename,
  filePath,
  fileSize,
  isZip = false,
  codeOrder,
}) => {
  const result = await query(
    `INSERT INTO generated_codes 
     (message_id, model_used, code_content, language, filename, file_path, file_size, is_zip, code_order) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING id, message_id, model_used, code_content, language, filename, 
               file_path, file_size, is_zip, code_order, download_count, created_at`,
    [messageId, modelUsed, codeContent, language, filename, filePath, fileSize, isZip, codeOrder]
  );
  return result.rows[0];
};

/**
 * Incrementar contador de descargas
 */
export const incrementDownloadCount = async (codeId) => {
  const result = await query(
    `UPDATE generated_codes 
     SET download_count = download_count + 1 
     WHERE id = $1 
     RETURNING id, download_count`,
    [codeId]
  );
  return result.rows[0];
};

/**
 * Eliminar un código generado
 */
export const deleteCode = async (codeId) => {
  const result = await query(
    'DELETE FROM generated_codes WHERE id = $1 RETURNING id, file_path',
    [codeId]
  );
  return result.rows[0];
};

/**
 * Eliminar todos los códigos de un mensaje
 */
export const deleteCodesByMessage = async (messageId) => {
  const result = await query(
    'DELETE FROM generated_codes WHERE message_id = $1 RETURNING id, file_path',
    [messageId]
  );
  return result.rows;
};

/**
 * Obtener códigos por lenguaje
 */
export const getCodesByLanguage = async (language) => {
  const result = await query(
    `SELECT id, message_id, model_used, filename, file_size, code_order, 
            download_count, created_at 
     FROM generated_codes 
     WHERE language = $1 
     ORDER BY created_at DESC`,
    [language]
  );
  return result.rows;
};

/**
 * Obtener contenido de un ZIP
 */
export const getZipContents = async (generatedCodeId) => {
  const result = await query(
    `SELECT id, generated_code_id, filename, file_path_in_zip, language, 
            content, file_size, created_at 
     FROM zip_contents 
     WHERE generated_code_id = $1 
     ORDER BY file_path_in_zip ASC`,
    [generatedCodeId]
  );
  return result.rows;
};

/**
 * Crear registro de contenido ZIP
 */
export const createZipContent = async ({
  generatedCodeId,
  filename,
  filePathInZip,
  language,
  content,
  fileSize,
}) => {
  const result = await query(
    `INSERT INTO zip_contents 
     (generated_code_id, filename, file_path_in_zip, language, content, file_size) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, generated_code_id, filename, file_path_in_zip, language, 
               content, file_size, created_at`,
    [generatedCodeId, filename, filePathInZip, language, content, fileSize]
  );
  return result.rows[0];
};
