import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('../../../src/controllers/users.controller.js', () => ({
  getUserById: jest.fn((req, res) => res.status(200).json({})),
  getUserByUsername: jest.fn((req, res) => res.status(200).json({})),
  updateUser: jest.fn((req, res) => res.status(200).json({})),
  changePassword: jest.fn((req, res) => res.status(200).json({})),
  deleteUser: jest.fn((req, res) => res.status(204).send())
}));

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validation.middleware.js', () => ({
  handleValidationErrors: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validators.js', () => ({
  updateUserValidation: [jest.fn((req, res, next) => next())],
  changePasswordValidation: [jest.fn((req, res, next) => next())],
  idParamValidation: [jest.fn((req, res, next) => next())]
}));

const usersRoutes = (await import('../../../src/routes/users.routes.js')).default;
const usersController = await import('../../../src/controllers/users.controller.js');

describe('Users Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', usersRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/users/:id', async () => {
    const res = await request(app).get('/api/users/1');
    expect(usersController.getUserById).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('GET /api/users/username/:username', async () => {
    const res = await request(app).get('/api/users/username/test');
    expect(usersController.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('PUT /api/users/me', async () => {
    const res = await request(app).put('/api/users/me').send({});
    expect(usersController.updateUser).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('PUT /api/users/me/password', async () => {
    const res = await request(app).put('/api/users/me/password').send({});
    expect(usersController.changePassword).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/users/me', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(usersController.deleteUser).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(204);
  });
});
