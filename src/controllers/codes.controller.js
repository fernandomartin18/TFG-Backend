import * as generatedCodes from '../db/generated_codes.js';
import * as messages from '../db/messages.js';
import * as chats from '../db/chats.js';
import { logger } from '../utils/logger.js';

/**
 * Obtener códigos generados de un mensaje
 * GET /api/messages/:messageId/codes
 */
export const getCodesByMessageId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = parseInt(req.params.messageId);

    const message = await messages.getMessageById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'Mensaje no encontrado',
        message: 'El mensaje solicitado no existe',
      });
    }

    // Verificar que el chat del mensaje pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(message.chat_id, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a estos códigos',
      });
    }

    const codes = await generatedCodes.getCodesByMessageId(messageId);

    res.json({
      codes,
      count: codes.length,
    });
  } catch (error) {
    logger.error('Error al obtener códigos generados:', error);
    res.status(500).json({
      error: 'Error al obtener códigos',
      message: 'No se pudieron cargar los códigos generados',
    });
  }
};

/**
 * Obtener un código generado específico
 * GET /api/codes/:id
 */
export const getCodeById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const codeId = parseInt(req.params.id);

    const code = await generatedCodes.getCodeById(codeId);

    if (!code) {
      return res.status(404).json({
        error: 'Código no encontrado',
        message: 'El código solicitado no existe',
      });
    }

    const message = await messages.getMessageById(code.message_id);

    // Verificar que el chat del mensaje pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(message.chat_id, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a este código',
      });
    }

    // Si es un ZIP, obtener su contenido
    let zipContents = null;
    if (code.is_zip) {
      zipContents = await generatedCodes.getZipContents(codeId);
    }

    res.json({
      code: {
        ...code,
        zipContents,
      },
    });
  } catch (error) {
    logger.error('Error al obtener código:', error);
    res.status(500).json({
      error: 'Error al obtener código',
      message: 'No se pudo cargar el código',
    });
  }
};

/**
 * Crear un código generado
 * POST /api/messages/:messageId/codes
 */
export const createCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = parseInt(req.params.messageId);
    const {
      modelUsed,
      codeContent,
      language,
      filename,
      filePath,
      fileSize,
      isZip,
      codeOrder,
    } = req.body;

    // Validar campos requeridos
    if (!modelUsed || !codeContent || !language || !filename) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requieren: modelUsed, codeContent, language, filename',
      });
    }

    const message = await messages.getMessageById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'Mensaje no encontrado',
        message: 'El mensaje no existe',
      });
    }

    // Verificar que el chat del mensaje pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(message.chat_id, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para agregar códigos a este mensaje',
      });
    }

    const newCode = await generatedCodes.createCode({
      messageId,
      modelUsed,
      codeContent,
      language,
      filename,
      filePath: filePath || '',
      fileSize: fileSize || 0,
      isZip: isZip || false,
      codeOrder: codeOrder || 1,
    });

    logger.info(`Código generado creado: ID ${newCode.id} para mensaje ${messageId}`);

    res.status(201).json({
      message: 'Código guardado exitosamente',
      code: newCode,
    });
  } catch (error) {
    logger.error('Error al crear código generado:', error);
    res.status(500).json({
      error: 'Error al guardar código',
      message: 'No se pudo guardar el código generado',
    });
  }
};

/**
 * Incrementar contador de descargas de un código
 * POST /api/codes/:id/download
 */
export const downloadCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const codeId = parseInt(req.params.id);

    const code = await generatedCodes.getCodeById(codeId);

    if (!code) {
      return res.status(404).json({
        error: 'Código no encontrado',
        message: 'El código no existe',
      });
    }

    const message = await messages.getMessageById(code.message_id);

    // Verificar que el chat del mensaje pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(message.chat_id, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para descargar este código',
      });
    }

    const updatedCode = await generatedCodes.incrementDownloadCount(codeId);

    logger.info(`Código descargado: ID ${codeId} (total: ${updatedCode.download_count})`);

    res.json({
      message: 'Descarga registrada',
      downloadCount: updatedCode.download_count,
    });
  } catch (error) {
    logger.error('Error al registrar descarga:', error);
    res.status(500).json({
      error: 'Error al registrar descarga',
      message: 'No se pudo registrar la descarga',
    });
  }
};

/**
 * Eliminar un código generado
 * DELETE /api/codes/:id
 */
export const deleteCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const codeId = parseInt(req.params.id);

    const code = await generatedCodes.getCodeById(codeId);

    if (!code) {
      return res.status(404).json({
        error: 'Código no encontrado',
        message: 'El código no existe',
      });
    }

    const message = await messages.getMessageById(code.message_id);

    // Verificar que el chat del mensaje pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(message.chat_id, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar este código',
      });
    }

    const deletedCode = await generatedCodes.deleteCode(codeId);

    logger.info(`Código eliminado: ID ${codeId}`);

    res.json({
      message: 'Código eliminado exitosamente',
      codeId: deletedCode.id,
    });
  } catch (error) {
    logger.error('Error al eliminar código:', error);
    res.status(500).json({
      error: 'Error al eliminar código',
      message: 'No se pudo eliminar el código',
    });
  }
};
