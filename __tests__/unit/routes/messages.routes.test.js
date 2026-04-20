import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/messages.controller.js', () => ({
  getMessagesByChatId: jest.fn((req, res) => res.status(200).json([])),
  createMessage: jest.fn((req, res) => res.status(201).json({})),
  getMessageById: jest.fn((req, res) => res.status(200).json({})),
  deleteMessage: jest.fn((req, res) => res.status(204).send())
}));

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validation.middleware.js', () => ({
  handleValidationErrors: jest.fn((req, res, next) => next())
}));

const messagesRoutes = (await import('../../../src/routes/messages.routes.js')).default;
const messagesController = await import('../../../src/controllers/messages.controller.js');

describe('Messages Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', messagesRoutes); // as it configures /chats/:chatId/messages internally
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/chats/:chatId/messages', async () => {
    const res = await request(app).get('/api/chats/1/messages');
    expect(messagesController.getMessagesByChatId).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/chats/:chatId/messages', async () => {
    const res = await request(app).post('/api/chats/1/messages').send({
      role: 'user',
      content: 'Hello'
    });
    expect(messagesController.createMessage).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
  });

  it('GET /api/messages/:id', async () => {
    const res = await request(app).get('/api/messages/1');
    expect(messagesController.getMessageById).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/messages/:id', async () => {
    const res = await request(app).delete('/api/messages/1');
    expect(messagesController.deleteMessage).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);
  });
});
