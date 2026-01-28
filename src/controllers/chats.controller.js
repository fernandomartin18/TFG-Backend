import * as chats from '../db/chats.js';
import * as messages from '../db/messages.js';
import { logger } from '../utils/logger.js';

/**
 * Obtener todos los chats del usuario autenticado
 * GET /api/chats
 */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userChats = await chats.getChatsByUserId(userId);

    res.json({
      chats: userChats,
      count: userChats.length,
    });
  } catch (error) {
    logger.error('Error al obtener chats del usuario:', error);
    res.status(500).json({
      error: 'Error al obtener chats',
      message: 'No se pudieron cargar los chats',
    });
  }
};

/**
 * Obtener un chat específico con sus mensajes
 * GET /api/chats/:id
 */
export const getChatById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = parseInt(req.params.id);

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a este chat',
      });
    }

    const chat = await chats.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: 'Chat no encontrado',
        message: 'El chat solicitado no existe',
      });
    }

    // Obtener mensajes del chat
    const chatMessages = await messages.getMessagesByChatId(chatId);

    res.json({
      chat: {
        ...chat,
        messages: chatMessages,
      },
    });
  } catch (error) {
    logger.error('Error al obtener chat:', error);
    res.status(500).json({
      error: 'Error al obtener chat',
      message: 'No se pudo cargar el chat',
    });
  }
};

/**
 * Crear un nuevo chat
 * POST /api/chats
 */
export const createChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title } = req.body;

    const newChat = await chats.createChat(userId, title || 'Nuevo Chat');

    logger.info(`Chat creado: ID ${newChat.id} por usuario ${userId}`);

    res.status(201).json({
      message: 'Chat creado exitosamente',
      chat: newChat,
    });
  } catch (error) {
    logger.error('Error al crear chat:', error);
    res.status(500).json({
      error: 'Error al crear chat',
      message: 'No se pudo crear el chat',
    });
  }
};

/**
 * Actualizar el título de un chat
 * PUT /api/chats/:id
 */
export const updateChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El título es requerido',
      });
    }

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para modificar este chat',
      });
    }

    const updatedChat = await chats.updateChatTitle(chatId, title.trim());

    if (!updatedChat) {
      return res.status(404).json({
        error: 'Chat no encontrado',
        message: 'El chat no existe',
      });
    }

    logger.info(`Chat actualizado: ID ${chatId}`);

    res.json({
      message: 'Chat actualizado exitosamente',
      chat: updatedChat,
    });
  } catch (error) {
    logger.error('Error al actualizar chat:', error);
    res.status(500).json({
      error: 'Error al actualizar chat',
      message: 'No se pudo actualizar el chat',
    });
  }
};

/**
 * Eliminar un chat
 * DELETE /api/chats/:id
 */
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = parseInt(req.params.id);

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar este chat',
      });
    }

    const deletedChat = await chats.deleteChat(chatId);

    if (!deletedChat) {
      return res.status(404).json({
        error: 'Chat no encontrado',
        message: 'El chat no existe',
      });
    }

    logger.info(`Chat eliminado: ID ${chatId}`);

    res.json({
      message: 'Chat eliminado exitosamente',
      chatId: deletedChat.id,
    });
  } catch (error) {
    logger.error('Error al eliminar chat:', error);
    res.status(500).json({
      error: 'Error al eliminar chat',
      message: 'No se pudo eliminar el chat',
    });
  }
};

/**
 * Fijar o desfijar un chat
 * PATCH /api/chats/:id/pin
 */
export const togglePinChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatId = parseInt(req.params.id);
    const { pinned } = req.body;

    if (typeof pinned !== 'boolean') {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El campo pinned debe ser un booleano',
      });
    }

    // Verificar que el chat pertenezca al usuario
    const isOwner = await chats.verifyChatOwnership(chatId, userId);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para modificar este chat',
      });
    }

    const updatedChat = await chats.updateChatPinned(chatId, pinned);

    if (!updatedChat) {
      return res.status(404).json({
        error: 'Chat no encontrado',
        message: 'El chat no existe',
      });
    }

    logger.info(`Chat ${pinned ? 'fijado' : 'desfijado'}: ID ${chatId}`);

    res.json({
      message: `Chat ${pinned ? 'fijado' : 'desfijado'} exitosamente`,
      chat: updatedChat,
    });
  } catch (error) {
    logger.error('Error al fijar/desfijar chat:', error);
    res.status(500).json({
      error: 'Error al fijar/desfijar chat',
      message: 'No se pudo actualizar el estado del chat',
    });
  }
};
