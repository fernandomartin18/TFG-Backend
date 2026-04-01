import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/models.controller.js', () => {
  return {
    modelsController: {
      listModels: jest.fn((req, res) => res.status(200).json({ models: ['m1'] })),
      getAutoSelectedModels: jest.fn((req, res) => res.status(200).json({ vision_model: 'v1' })),
      unloadModel: jest.fn((req, res) => res.status(200).json({ success: true }))
    }
  };
});

const modelsRoutes = (await import('../../../src/routes/models.routes.js')).default;
const { modelsController } = await import('../../../src/controllers/models.controller.js');

describe('Models Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/models', modelsRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/models debería llamar a listModels', async () => {
    const response = await request(app).get('/api/models');
    expect(modelsController.listModels).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ models: ['m1'] });
  });

  it('GET /api/models/auto-select debería llamar a getAutoSelectedModels', async () => {
    const response = await request(app).get('/api/models/auto-select');
    expect(modelsController.getAutoSelectedModels).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ vision_model: 'v1' });
  });

  it('POST /api/models/unload debería llamar a unloadModel', async () => {
    const response = await request(app).post('/api/models/unload').send({ model: 'm1' });
    expect(modelsController.unloadModel).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });
});
