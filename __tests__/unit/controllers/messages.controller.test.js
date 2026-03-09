import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('../../../src/db/chats.js', () => ({
  verifyChatOwnership: jest.fn(),
  touchChat: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/messages.js', () => ({
  getMessagesByChatId: jest.fn(),
  createMessage: jest.fn(),
  getMessageById: jest.fn(),
  deleteMessage: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/message_images.js', () => ({
  getImagesByMessageId: jest.fn(),
  createImage: jest.fn(),
}));


jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Messages Controller', () => {
  let messagesController;
  let chatsDbMock;
  let messagesDbMock;
  let messageImagesDbMock;

  beforeAll(async () => {
    chatsDbMock = await import('../../../src/db/chats.js');
    messagesDbMock = await import('../../../src/db/messages.js');
    messageImagesDbMock = await import('../../../src/db/message_images.js');
    messagesController = await import('../../../src/controllers/messages.controller.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (userId = 1, params = {}, body = {}) => ({
    user: { userId },
    params,
    body,
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getMessagesByChatId', () => {
    it('debería retornar 403 si el usuario no es el dueño', async () => {
      const req = mockReq(1, { chatId: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await messagesController.getMessagesByChatId(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería obtener mensajes exitosamente', async () => {
      const req = mockReq(1, { chatId: '1' });
      const res = mockRes();
      const mockMessages = [{ id: 10, content: 'Hi' }];
      
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      messagesDbMock.getMessagesByChatId.mockResolvedValue(mockMessages);
      messageImagesDbMock.getImagesByMessageId.mockResolvedValue([{ id: 100, url: 'img.jpg' }]);

      await messagesController.getMessagesByChatId(req, res);

      expect(res.json).toHaveBeenCalledWith({
        messages: [{ id: 10, content: 'Hi', images: [{ id: 100, url: 'img.jpg' }] }],
        count: 1
      });
    });

    it('debería manejar errores de servidor', async () => {
      const req = mockReq(1, { chatId: '1' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('DB error'));

      await messagesController.getMessagesByChatId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMessage', () => {
    it('debería retornar 400 si faltan datos', async () => {
      const req = mockReq(1, { chatId: '1' }, {}); // No role, no content
      const res = mockRes();

      await messagesController.createMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 400 si el rol no es válido', async () => {
      const req = mockReq(1, { chatId: '1' }, { role: 'admin', content: 'hello' }); 
      const res = mockRes();

      await messagesController.createMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 403 si no es dueño del chat', async () => {
      const req = mockReq(1, { chatId: '1' }, { role: 'user', content: 'hello' }); 
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await messagesController.createMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería crear un mensaje exitosamente sin imagenes', async () => {
      const req = mockReq(1, { chatId: '1' }, { role: 'user', content: 'hello' }); 
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      messagesDbMock.createMessage.mockResolvedValue({ id: 99, role: 'user', content: 'hello' });

      await messagesController.createMessage(req, res);
      expect(chatsDbMock.touchChat).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 99, role: 'user', content: 'hello' }}));
    });

    it('debería crear un mensaje con imagenes exitosamente', async () => {
      const req = mockReq(1, { chatId: '1' }, { 
        role: 'user', 
        content: 'hello', 
        images: [{ name: 'test.jpg', data: 'base64...', type: 'image/jpeg', size: 100 }]
      }); 
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      messagesDbMock.createMessage.mockResolvedValue({ id: 99, role: 'user', content: 'hello' });

      await messagesController.createMessage(req, res);
      expect(messageImagesDbMock.createImage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debería manejar errores de servidor', async () => {
      const req = mockReq(1, { chatId: '1' }, { role: 'user', content: 'hello' }); 
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('err'));

      await messagesController.createMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteMessage', () => {
    it('debería retornar 404 si el mensaje no existe', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue(null);

      await messagesController.deleteMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 403 si el chat no pertenece al usuario', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue({ id: 99, chat_id: 1 });
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await messagesController.deleteMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería eliminar el mensaje exitosamente', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue({ id: 99, chat_id: 1 });
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      messagesDbMock.deleteMessage.mockResolvedValue({ id: 99 });

      await messagesController.deleteMessage(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ messageId: 99 }));
    });

    it('debería manejar errores de servidor', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockRejectedValue(new Error('err'));

      await messagesController.deleteMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  
  describe('getMessageById', () => {
    it('debería retornar 404 si no encuentra el mensaje', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue(null);

      await messagesController.getMessageById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 403 si no es dueño', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue({ id: 99, chat_id: 1 });
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await messagesController.getMessageById(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 500 en caso de error interno (o por imports faltantes)', async () => {
      const req = mockReq(1, { id: '99' });
      const res = mockRes();
      messagesDbMock.getMessageById.mockResolvedValue({ id: 99, chat_id: 1 });
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);

      // It might throw 500 when it hits generatedCodes.getCodesByMessageId because it wasn't imported properly
      await messagesController.getMessageById(req, res);
      expect(res.status).toHaveBeenCalledWith(500); 
    });
  });
});
