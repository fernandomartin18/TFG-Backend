import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mocks
jest.unstable_mockModule('multer', () => {
  const dummyMiddleware = jest.fn((req, res, next) => next());
  const multerMock = jest.fn(() => ({
    array: jest.fn(() => dummyMiddleware)
  }));
  multerMock.memoryStorage = jest.fn();
  return { default: multerMock };
});

jest.unstable_mockModule('../../../src/controllers/generate.controller.js', () => {
  return {
    generateController: {
      generate: jest.fn((req, res) => res.status(200).json({ result: 'code' })),
      generateStream: jest.fn((req, res) => res.status(200).json({ status: 'streaming' }))
    }
  };
});

const generateRoutes = (await import('../../../src/routes/generate.routes.js')).default;
const { generateController } = await import('../../../src/controllers/generate.controller.js');

describe('Generate Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/generate', generateRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/generate', async () => {
    const res = await request(app).post('/api/generate').send({});
    expect(generateController.generate).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('POST /api/generate/stream', async () => {
    const res = await request(app).post('/api/generate/stream').send({});
    expect(generateController.generateStream).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
