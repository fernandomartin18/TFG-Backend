import * as messages from '../db/messages.js';
import * as chats from '../db/chats.js';
import * as messageImages from '../db/message_images.js';
import { logger } from '../utils/logger.js';

/**
 * Obtener mensajes de un chat
 * GET /api/chats/:chatId/messages
 */
export const getMessagesByChatId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = Number.parseInt(req.params.chatId);

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a este chat',
      });
    }

    const chatMessages = await messages.getMessagesByChatId(chatId);

    // Obtener imágenes para cada mensaje
    const messagesWithDetails = await Promise.all(
      chatMessages.map(async (message) => {
        const images = await messageImages.getImagesByMessageId(message.id);
        return {
          ...message,
          images,
        };
      })
    );

    res.json({
      messages: messagesWithDetails,
      count: messagesWithDetails.length,
    });
  } catch (error) {
    logger.error('Error al obtener mensajes:', error);
    res.status(500).json({
      error: 'Error al obtener mensajes',
      message: 'No se pudieron cargar los mensajes',
    });
  }
};

/**
 * Crear un nuevo mensaje
 * POST /api/chats/:chatId/messages
 */
export const createMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = Number.parseInt(req.params.chatId);
    const { role, content, isError, isCollapsible, images } = req.body;

    // Validar campos requeridos
    if (!role || !content) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El rol y el contenido son requeridos',
      });
    }

    // Validar rol
    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El rol debe ser "user" o "assistant"',
      });
    }

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para agregar mensajes a este chat',
      });
    }

    // Crear el mensaje
    const newMessage = await messages.createMessage({
      chatId,
      role,
      content,
      isError: isError || false,
      isCollapsible: isCollapsible || false,
    });

    // Guardar imágenes si se proporcionaron
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await messageImages.createImage({
          messageId: newMessage.id,
          originalFilename: image.name || `image_${i + 1}`,
          imageData: image.data,
          mimeType: image.type || 'image/jpeg',
          fileSize: image.size || 0,
          imageOrder: i + 1,
        });
      }
    }

    // Actualizar timestamp del chat
    await chats.touchChat(chatId);

    logger.info(`Mensaje creado: ID ${newMessage.id} en chat ${chatId} con ${images?.length || 0} imágenes`);

    res.status(201).json({
      message: 'Mensaje creado exitosamente',
      data: newMessage,
    });
  } catch (error) {
    logger.error('Error al crear mensaje:', error);
    res.status(500).json({
      error: 'Error al crear mensaje',
      message: 'No se pudo crear el mensaje',
    });
  }
};

/**
 * Obtener un mensaje específico con todos sus detalles
 * GET /api/messages/:id
 */
export const getMessageById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = Number.parseInt(req.params.id);

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
        message: 'No tienes permiso para acceder a este mensaje',
      });
    }

    // Obtener imágenes y códigos del mensaje
    const images = await messageImages.getImagesByMessageId(messageId);
    const codes = await generatedCodes.getCodesByMessageId(messageId);

    res.json({
      message: {
        ...message,
        images,
        generatedCodes: codes,
      },
    });
  } catch (error) {
    logger.error('Error al obtener mensaje:', error);
    res.status(500).json({
      error: 'Error al obtener mensaje',
      message: 'No se pudo cargar el mensaje',
    });
  }
};

/**
 * Eliminar un mensaje
 * DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = Number.parseInt(req.params.id);

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
        message: 'No tienes permiso para eliminar este mensaje',
      });
    }

    const deletedMessage = await messages.deleteMessage(messageId);

    logger.info(`Mensaje eliminado: ID ${messageId}`);

    res.json({
      message: 'Mensaje eliminado exitosamente',
      messageId: deletedMessage.id,
    });
  } catch (error) {
    logger.error('Error al eliminar mensaje:', error);
    res.status(500).json({
      error: 'Error al eliminar mensaje',
      message: 'No se pudo eliminar el mensaje',
    });
  }
};
