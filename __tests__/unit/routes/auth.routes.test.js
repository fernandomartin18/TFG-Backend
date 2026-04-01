import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../../../src/controllers/auth.controller.js', () => ({
  register: jest.fn((req, res) => res.status(201).json({ msg: 'registered' })),
  login: jest.fn((req, res) => res.status(200).json({ msg: 'logged params' })),
  refresh: jest.fn((req, res) => res.status(200).json({ msg: 'refreshed' })),
  getProfile: jest.fn((req, res) => res.status(200).json({ msg: 'profile' })),
  logout: jest.fn((req, res) => res.status(200).json({ msg: 'logged out' }))
}));

jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validation.middleware.js', () => ({
  handleValidationErrors: jest.fn((req, res, next) => next())
}));

jest.unstable_mockModule('../../../src/middlewares/validators.js', () => {
  const dummyMiddleware = jest.fn((req, res, next) => next());
  return {
    registerValidation: [dummyMiddleware],
    loginValidation: [dummyMiddleware],
    refreshTokenValidation: [dummyMiddleware]
  };
});

const authRoutes = (await import('../../../src/routes/auth.routes.js')).default;
const authController = await import('../../../src/controllers/auth.controller.js');

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(authController.register).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
  });

  it('POST /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(authController.login).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/refresh', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(authController.refresh).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/profile', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(authController.getProfile).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/logout', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(authController.logout).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
