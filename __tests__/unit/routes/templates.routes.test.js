import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  optionalAuth: jest.fn((req, res, next) => next()),
  authenticate: jest.fn((req, res, next) => next()),
}));

jest.unstable_mockModule('../../../src/controllers/templates.controller.js', () => ({
  getTemplates: jest.fn((req, res) => res.status(200).json([{ id: 1, name: 'Template 1' }])),
  createTemplate: jest.fn((req, res) => res.status(201).json({ id: 2 })),
  updateTemplate: jest.fn((req, res) => res.status(200).json({ id: 2 })),
  deleteTemplate: jest.fn((req, res) => res.status(204).send()),
}));

const templatesRoutes = (await import('../../../src/routes/templates.routes.js')).default;
const templatesController = await import('../../../src/controllers/templates.controller.js');
const authMiddleware = await import('../../../src/middlewares/auth.middleware.js');

describe('Templates Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/templates', templatesRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/templates debería llamar a getTemplates', async () => {
    const response = await request(app).get('/api/templates');
    
    expect(authMiddleware.optionalAuth).toHaveBeenCalledTimes(1);
    expect(templatesController.getTemplates).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Template 1' }]);
  });

  it('POST /api/templates debería llamar a createTemplate', async () => {
    const newTemplate = { name: 'New Template' };
    const response = await request(app)
      .post('/api/templates')
      .send(newTemplate);
    
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);
    expect(templatesController.createTemplate).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 2 });
  });

  it('PUT /api/templates/:id debería llamar a updateTemplate', async () => {
    const updateData = { name: 'Updated Template' };
    const response = await request(app)
      .put('/api/templates/2')
      .send(updateData);
    
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);
    expect(templatesController.updateTemplate).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 2 });
  });

  it('DELETE /api/templates/:id debería llamar a deleteTemplate', async () => {
    const response = await request(app).delete('/api/templates/2');
    
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);
    expect(templatesController.deleteTemplate).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(204);
  });
});
