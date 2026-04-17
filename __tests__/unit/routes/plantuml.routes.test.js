import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  optionalAuth: jest.fn((req, res, next) => next()),
  authenticate: jest.fn((req, res, next) => next()),
}));

jest.unstable_mockModule('../../../src/controllers/plantuml.controller.js', () => ({
  getTemplates: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createTemplate: jest.fn((req, res) => res.status(201).json({ id: 2 })),
  updateTemplate: jest.fn((req, res) => res.status(200).json({ id: 2 })),
  deleteTemplate: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

const plantUmlRoutes = (await import('../../../src/routes/plantuml.routes.js')).default;
const plantUmlController = await import('../../../src/controllers/plantuml.controller.js');
const authMiddleware = await import('../../../src/middlewares/auth.middleware.js');

describe('PlantUML Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api/plantuml-templates', plantUmlRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/plantuml-templates debería pasar por optionalAuth y llamar a getTemplates', async () => {
    const response = await request(app).get('/api/plantuml-templates');
    expect(authMiddleware.optionalAuth).toHaveBeenCalledTimes(1);
    expect(plantUmlController.getTemplates).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('POST /api/plantuml-templates debería pasar por authenticate y llamar a createTemplate', async () => {
    const response = await request(app).post('/api/plantuml-templates').send({ title: 'T' });
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);
    expect(plantUmlController.createTemplate).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
  });
});
