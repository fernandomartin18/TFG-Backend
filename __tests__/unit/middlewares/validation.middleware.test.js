import { body, validationResult } from 'express-validator';
import { handleValidationErrors } from '../../../src/middlewares/validation.middleware.js';

const createMockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (data) { this.body = data; return this; };
  return res;
};

const createNext = () => {
  let called = false;
  const fn = () => { called = true; };
  fn.called = () => called;
  return fn;
};

// Ejecuta validaciones en un mock de request y devuelve el req enriquecido
const runValidations = async (validations, body) => {
  const req = { body };
  for (const v of validations) await v.run(req);
  return req;
};

describe('handleValidationErrors middleware', () => {
  test('llama a next() si no hay errores de validación', async () => {
    const validations = [
      body('email').isEmail(),
    ];
    const req = await runValidations(validations, { email: 'test@example.com' });
    const res = createMockRes();
    const next = createNext();

    handleValidationErrors(req, res, next);

    expect(next.called()).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  test('responde 400 si hay errores de validación', async () => {
    const validations = [
      body('email').isEmail().withMessage('Email inválido'),
    ];
    const req = await runValidations(validations, { email: 'no-es-email' });
    const res = createMockRes();
    const next = createNext();

    handleValidationErrors(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Errores de validación');
    expect(next.called()).toBe(false);
  });

  test('devuelve array de errores con field y message', async () => {
    const validations = [
      body('username').notEmpty().withMessage('Username requerido'),
      body('email').isEmail().withMessage('Email inválido'),
    ];
    const req = await runValidations(validations, { username: '', email: 'malo' });
    const res = createMockRes();
    const next = createNext();

    handleValidationErrors(req, res, next);

    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors[0]).toHaveProperty('field');
    expect(res.body.errors[0]).toHaveProperty('message');
  });

  test('el array de errores contiene el mensaje correcto', async () => {
    const validations = [
      body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    ];
    const req = await runValidations(validations, { password: '123' });
    const res = createMockRes();
    const next = createNext();

    handleValidationErrors(req, res, next);

    const error = res.body.errors.find(e => e.field === 'password');
    expect(error).toBeDefined();
    expect(error.message).toBe('Mínimo 6 caracteres');
  });

  test('no bloquea la petición si todos los campos son válidos', async () => {
    const validations = [
      body('username').isLength({ min: 3, max: 50 }),
      body('email').isEmail(),
      body('password').isLength({ min: 6 }),
    ];
    const req = await runValidations(validations, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Pass123',
    });
    const res = createMockRes();
    const next = createNext();

    handleValidationErrors(req, res, next);

    expect(next.called()).toBe(true);
    expect(res.statusCode).toBeNull();
  });
});
