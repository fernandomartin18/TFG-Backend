import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/chats.controller.js', () => ({
  getUserChats: jest.fn((req, res) => res.status(200).json([])),
  createChat: jest.fn((req, res) => res.status(201).json({})),
  getChatById: jest.fn((req, res) => res.status(200).json({})),
  updateChat: jest.fn((req, res) => res.status(200).json({})),
  togglePinChat: jest.fn((req, res) => res.status(200).json({})),
  deleteChat: jest.fn((req, res) => res.status(204).send())
}));

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validation.middleware.js', () => ({
  handleValidationErrors: jest.fn((req, res, next) => next())
}));

// Usamos el express-validator original pero confiamos en que handleValidationErrors se simula
const chatsRoutes = (await import('../../../src/routes/chats.routes.js')).default;
const chatsController = await import('../../../src/controllers/chats.controller.js');

describe('Chats Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chats', chatsRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/chats', async () => {
    const res = await request(app).get('/api/chats');
    expect(chatsController.getUserChats).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/chats', async () => {
    const res = await request(app).post('/api/chats').send({ title: 'New Chat' });
    expect(chatsController.createChat).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
  });

  it('GET /api/chats/:id', async () => {
    const res = await request(app).get('/api/chats/1');
    expect(chatsController.getChatById).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('PUT /api/chats/:id', async () => {
    const res = await request(app).put('/api/chats/1').send({ title: 'Updated' });
    expect(chatsController.updateChat).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('PATCH /api/chats/:id/pin', async () => {
    const res = await request(app).patch('/api/chats/1/pin').send({ pinned: true });
    expect(chatsController.togglePinChat).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/chats/:id', async () => {
    const res = await request(app).delete('/api/chats/1');
    expect(chatsController.deleteChat).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);
  });
});
