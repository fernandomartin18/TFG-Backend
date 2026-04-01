import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/templates.controller.js', () => ({
  getTemplates: jest.fn((req, res) => res.status(200).json([{ id: 1, name: 'Template 1' }]))
}));

const templatesRoutes = (await import('../../../src/routes/templates.routes.js')).default;
const templatesController = await import('../../../src/controllers/templates.controller.js');

describe('Templates Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api/templates', templatesRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/templates debería llamar a getTemplates', async () => {
    const response = await request(app).get('/api/templates');
    
    expect(templatesController.getTemplates).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Template 1' }]);
  });
});
