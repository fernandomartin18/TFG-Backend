import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('../../../src/db/chats.js', () => ({
  getChatsByUserId: jest.fn(),
  verifyChatOwnership: jest.fn(),
  getChatById: jest.fn(),
  createChat: jest.fn(),
  updateChatTitle: jest.fn(),
  deleteChat: jest.fn(),
  updateChatPinned: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/messages.js', () => ({
  getMessagesWithDetails: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Chats Controller', () => {
  let chatsController;
  let chatsDbMock;
  let messagesDbMock;

  beforeAll(async () => {
    chatsDbMock = await import('../../../src/db/chats.js');
    messagesDbMock = await import('../../../src/db/messages.js');
    chatsController = await import('../../../src/controllers/chats.controller.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (userId = 1, params = {}, body = {}) => ({
    user: { userId },
    params,
    body
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getUserChats', () => {
    it('debería obtener todos los chats del usuario', async () => {
      const req = mockReq();
      const res = mockRes();
      const mockChats = [{ id: 1, title: 'Chat 1' }, { id: 2, title: 'Chat 2' }];
      chatsDbMock.getChatsByUserId.mockResolvedValue(mockChats);

      await chatsController.getUserChats(req, res);

      expect(chatsDbMock.getChatsByUserId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        chats: mockChats,
        count: 2
      });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq();
      const res = mockRes();
      chatsDbMock.getChatsByUserId.mockRejectedValue(new Error('DB Error'));

      await chatsController.getUserChats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Error al obtener chats' }));
    });
  });

  describe('getChatById', () => {
    it('debería obtener un chat', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      const mockChat = { id: 1, title: 'Chat 1' };
      const mockChatMessages = [{ id: 10, text: 'Hello' }];
      
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.getChatById.mockResolvedValue(mockChat);
      messagesDbMock.getMessagesWithDetails.mockResolvedValue(mockChatMessages);

      await chatsController.getChatById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        chat: { ...mockChat, messages: mockChatMessages }
      });
    });

    it('debería retornar 403 si el usuario no es dueño', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await chatsController.getChatById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 404 si el chat no existe', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.getChatById.mockResolvedValue(null);

      await chatsController.getChatById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('DB Error'));

      await chatsController.getChatById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createChat', () => {
    it('debería crear un nuevo chat', async () => {
      const req = mockReq(1, {}, { title: 'New Chat' });
      const res = mockRes();
      const mockNewChat = { id: 1, title: 'New Chat' };
      
      chatsDbMock.createChat.mockResolvedValue(mockNewChat);

      await chatsController.createChat(req, res);

      expect(chatsDbMock.createChat).toHaveBeenCalledWith(1, 'New Chat');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ chat: mockNewChat }));
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, {}, { title: 'New Chat' });
      const res = mockRes();
      chatsDbMock.createChat.mockRejectedValue(new Error('Error'));

      await chatsController.createChat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateChat', () => {
    it('debería actualizar un chat', async () => {
      const req = mockReq(1, { id: '1' }, { title: 'Updated' });
      const res = mockRes();
      const updatedMock = { id: 1, title: 'Updated' };
      
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.updateChatTitle.mockResolvedValue(updatedMock);

      await chatsController.updateChat(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ chat: updatedMock }));
    });

    it('debería retornar 400 si el titulo esta vacío', async () => {
      const req = mockReq(1, { id: '1' }, { title: '' });
      const res = mockRes();

      await chatsController.updateChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 403 si el usuario no es el dueño', async () => {
      const req = mockReq(1, { id: '1' }, { title: 'Updated' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await chatsController.updateChat(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 404 si no se actualiza', async () => {
      const req = mockReq(1, { id: '1' }, { title: 'Updated' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.updateChatTitle.mockResolvedValue(null);

      await chatsController.updateChat(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { id: '1' }, { title: 'Updated' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('Err'));

      await chatsController.updateChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteChat', () => {
    it('debería borrar un chat', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      const deletedMock = { id: 1 };

      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.deleteChat.mockResolvedValue(deletedMock);

      await chatsController.deleteChat(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ chatId: 1 }));
    });

    it('debería retornar 403 si no es dueño', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await chatsController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 404 si no existe', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.deleteChat.mockResolvedValue(null);

      await chatsController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 500 si ocurre un error', async () => {
      const req = mockReq(1, { id: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('Err'));

      await chatsController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('togglePinChat', () => {
    it('debería fijar un chat', async () => {
      const req = mockReq(1, { id: '1' }, { pinned: true });
      const res = mockRes();
      const mockUpdated = { id: 1, pinned: true };

      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.updateChatPinned.mockResolvedValue(mockUpdated);

      await chatsController.togglePinChat(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ chat: mockUpdated }));
    });

    it('debería retornar 400 si pinned no es booleano', async () => {
      const req = mockReq(1, { id: '1' }, { pinned: 'yes' });
      const res = mockRes();

      await chatsController.togglePinChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 403 si no es dueño', async () => {
      const req = mockReq(1, { id: '1' }, { pinned: true });
      const res = mockRes();

      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await chatsController.togglePinChat(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 404 si no se encuentra', async () => {
      const req = mockReq(1, { id: '1' }, { pinned: true });
      const res = mockRes();

      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.updateChatPinned.mockResolvedValue(null);

      await chatsController.togglePinChat(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 500 si ocurre error', async () => {
      const req = mockReq(1, { id: '1' }, { pinned: true });
      const res = mockRes();

      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('Err'));

      await chatsController.togglePinChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});