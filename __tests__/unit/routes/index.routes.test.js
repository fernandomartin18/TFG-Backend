import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks para simplificar el test del router central
jest.unstable_mockModule('../../../src/routes/health.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('health'))
}));
jest.unstable_mockModule('../../../src/routes/auth.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('auth'))
}));
jest.unstable_mockModule('../../../src/routes/users.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('users'))
}));
jest.unstable_mockModule('../../../src/routes/models.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('models'))
}));
jest.unstable_mockModule('../../../src/routes/generate.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('generate'))
}));
jest.unstable_mockModule('../../../src/routes/chats.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('chats'))
}));
jest.unstable_mockModule('../../../src/routes/messages.routes.js', () => ({
  default: express.Router().get('/msgs', (req, res) => res.status(200).send('messages'))
}));
jest.unstable_mockModule('../../../src/routes/projects.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('projects'))
}));
jest.unstable_mockModule('../../../src/routes/templates.routes.js', () => ({
  default: express.Router().get('/', (req, res) => res.status(200).send('templates'))
}));

const indexRoutes = (await import('../../../src/routes/index.js')).default;

describe('Index Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api', indexRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería montar la ruta de health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.text).toBe('health');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de auth', async () => {
    const res = await request(app).get('/api/auth');
    expect(res.text).toBe('auth');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.text).toBe('users');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de models', async () => {
    const res = await request(app).get('/api/models');
    expect(res.text).toBe('models');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de generate', async () => {
    const res = await request(app).get('/api/generate');
    expect(res.text).toBe('generate');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de chats', async () => {
    const res = await request(app).get('/api/chats');
    expect(res.text).toBe('chats');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.text).toBe('projects');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.text).toBe('templates');
    expect(res.status).toBe(200);
  });

  it('debería montar la ruta de messages (ruta base /)', async () => {
    const res = await request(app).get('/api/msgs');
    expect(res.text).toBe('messages');
    expect(res.status).toBe(200);
  });
});
