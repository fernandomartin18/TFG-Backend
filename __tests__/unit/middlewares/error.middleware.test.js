import { errorHandler, notFoundHandler } from '../../../src/middlewares/error.middleware.js';

const createMockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (data) { this.body = data; return this; };
  return res;
};

const createMockReq = (overrides = {}) => ({
  originalUrl: '/test/path',
  ...overrides,
});

const createNext = () => {
  let called = false;
  const fn = () => { called = true; };
  fn.called = () => called;
  return fn;
};

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createNext();
  });

  test('responde 500 con error genérico por defecto', () => {
    const err = new Error('Error interno');

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error interno');
  });

  test('usa el status del error si está definido', () => {
    const err = new Error('No encontrado');
    err.status = 404;

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('No encontrado');
  });

  test('maneja MulterError de tamaño', () => {
    const err = new Error('File too large');
    err.name = 'MulterError';
    err.code = 'LIMIT_FILE_SIZE';

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Archivo demasiado grande');
    expect(res.body.details).toBe('File too large');
  });

  test('maneja MulterError genérico', () => {
    const err = new Error('Multer error');
    err.name = 'MulterError';
    err.code = 'OTHER_ERROR';

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Error al procesar el archivo');
    expect(res.body.details).toBe('Multer error');
  });

  test('maneja error de validación (status 400)', () => {
    const err = new Error('Petición inválida');
    err.status = 400;

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Petición inválida');
  });

  test('responde "Error interno del servidor" si no hay mensaje', () => {
    const err = {};

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  test('incluye stack trace en desarrollo', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Error con stack');

    errorHandler(err, req, res, next);

    expect(res.body.stack).toBeDefined();
    process.env.NODE_ENV = originalEnv;
  });

  test('no incluye stack trace en producción', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Error sin stack');

    errorHandler(err, req, res, next);

    expect(res.body.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });
});

describe('notFoundHandler middleware', () => {
  test('responde 404 con la ruta no encontrada', () => {
    const req = createMockReq({ originalUrl: '/ruta/inexistente' });
    const res = createMockRes();

    notFoundHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Ruta no encontrada');
    expect(res.body.path).toBe('/ruta/inexistente');
  });

  test('incluye el path original en la respuesta', () => {
    const req = createMockReq({ originalUrl: '/api/v1/recurso' });
    const res = createMockRes();

    notFoundHandler(req, res);

    expect(res.body.path).toBe('/api/v1/recurso');
  });
});
