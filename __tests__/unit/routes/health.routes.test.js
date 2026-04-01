import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/health.controller.js', () => ({
  healthCheck: jest.fn((req, res) => res.status(200).json({ status: 'ok' }))
}));

const healthRoutes = (await import('../../../src/routes/health.routes.js')).default;
const { healthCheck } = await import('../../../src/controllers/health.controller.js');

describe('Health Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /health debería llamar a healthCheck y retornar 200', async () => {
    const response = await request(app).get('/health');
    
    expect(healthCheck).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
