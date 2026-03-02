import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  testConnection: jest.fn(),
}));

jest.unstable_mockModule('axios', () => ({
  default: { get: jest.fn() },
}));

const { healthCheck } = await import('../../../src/controllers/health.controller.js');
const { testConnection } = await import('../../../src/config/database.js');
const axiosModule = await import('axios');
const axios = axiosModule.default;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = function (c) { this.statusCode = c; return this; };
  res.json = function (d) { this.body = d; return this; };
  return res;
};

describe('healthCheck controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve 200 cuando todos los servicios están ok', async () => {
    testConnection.mockResolvedValue(true);
    axios.get.mockResolvedValue({ status: 200 });

    const req = {};
    const res = mockRes();

    await healthCheck(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services.database).toBe('ok');
    expect(res.body.services.fastapi).toBe('ok');
  });

  test('devuelve 503 y "degraded" si la base de datos falla', async () => {
    testConnection.mockRejectedValue(new Error('DB connection failed'));
    axios.get.mockResolvedValue({ status: 200 });

    const req = {};
    const res = mockRes();

    await healthCheck(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('error');
    expect(res.body.services.fastapi).toBe('ok');
  });

  test('devuelve 503 y "degraded" si FastAPI falla', async () => {
    testConnection.mockResolvedValue(true);
    axios.get.mockRejectedValue(new Error('FastAPI unreachable'));

    const req = {};
    const res = mockRes();

    await healthCheck(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('ok');
    expect(res.body.services.fastapi).toBe('error');
  });

  test('devuelve 503 si ambos servicios fallan', async () => {
    testConnection.mockRejectedValue(new Error('DB error'));
    axios.get.mockRejectedValue(new Error('FastAPI error'));

    const req = {};
    const res = mockRes();

    await healthCheck(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('error');
    expect(res.body.services.fastapi).toBe('error');
  });

  test('la respuesta incluye timestamp', async () => {
    testConnection.mockResolvedValue(true);
    axios.get.mockResolvedValue({ status: 200 });

    const req = {};
    const res = mockRes();

    await healthCheck(req, res);

    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
