import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/projects.controller.js', () => ({
  getUserProjects: jest.fn((req, res) => res.status(200).json([])),
  createProject: jest.fn((req, res) => res.status(201).json({})),
  updateProjectName: jest.fn((req, res) => res.status(200).json({})),
  toggleProjectExpanded: jest.fn((req, res) => res.status(200).json({})),
  deleteProject: jest.fn((req, res) => res.status(204).send()),
  addChatToProject: jest.fn((req, res) => res.status(200).json({})),
  removeChatFromProject: jest.fn((req, res) => res.status(200).json({}))
}));

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

const projectsRoutes = (await import('../../../src/routes/projects.routes.js')).default;
const projectsController = await import('../../../src/controllers/projects.controller.js');

describe('Projects Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects', projectsRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(projectsController.getUserProjects).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/projects', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Proj' });
    expect(projectsController.createProject).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
  });

  it('PUT /api/projects/:projectId', async () => {
    const res = await request(app).put('/api/projects/1').send({ name: 'New Name' });
    expect(projectsController.updateProjectName).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('PATCH /api/projects/:projectId/toggle-expand', async () => {
    const res = await request(app).patch('/api/projects/1/toggle-expand').send({ isExpanded: true });
    expect(projectsController.toggleProjectExpanded).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/projects/:projectId', async () => {
    const res = await request(app).delete('/api/projects/1');
    expect(projectsController.deleteProject).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);
  });

  it('POST /api/projects/add-chat', async () => {
    const res = await request(app).post('/api/projects/add-chat').send({ chatId: 1 });
    expect(projectsController.addChatToProject).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/projects/remove-chat/:chatId', async () => {
    const res = await request(app).delete('/api/projects/remove-chat/1');
    expect(projectsController.removeChatFromProject).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
