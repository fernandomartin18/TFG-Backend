import { authenticate, optionalAuth } from '../../../src/middlewares/auth.middleware.js';
import { generateAccessToken } from '../../../src/services/auth.service.js';
import jwt from 'jsonwebtoken';
import { config } from '../../../src/config/index.js';

// Helper para crear mocks
const createMockResponse = () => {
  const res = {
    statusCode: null,
    jsonData: null
  };
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.jsonData = data;
    return this;
  };
  return res;
};

const createMockNext = () => {
  let called = false;
  const fn = () => { called = true; };
  fn.called = () => called;
  fn.reset = () => { called = false; };
  return fn;
};

describe('Auth Middleware', () => {
  const mockUser = {
    userId: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined
    };
    res = createMockResponse();
    next = createMockNext();
  });

  describe('authenticate middleware', () => {
    test('permite el acceso con token válido', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(next.called()).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser.userId);
      expect(req.user.username).toBe(mockUser.username);
      expect(req.user.email).toBe(mockUser.email);
    });

    test('rechaza petición sin header de autorización', () => {
      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'No se proporcionó token de autenticación',
        message: 'Se requiere autenticación para acceder a este recurso'
      });
      expect(next.called()).toBe(false);
    });

    test('rechaza petición con header sin Bearer', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = token; // Sin "Bearer "

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'No se proporcionó token de autenticación',
        message: 'Se requiere autenticación para acceder a este recurso'
      });
      expect(next.called()).toBe(false);
    });

    test('rechaza token inválido', () => {
      req.headers.authorization = 'Bearer token.invalido.123';

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
      expect(next.called()).toBe(false);
    });

    test('rechaza token expirado', () => {
      const expiredToken = jwt.sign(mockUser, config.jwt.secret, {
        expiresIn: '-1s'
      });
      req.headers.authorization = `Bearer ${expiredToken}`;

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente'
      });
      expect(next.called()).toBe(false);
    });

    test('rechaza token con firma incorrecta', () => {
      const token = generateAccessToken(mockUser);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      req.headers.authorization = `Bearer ${tamperedToken}`;

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
      expect(next.called()).toBe(false);
    });

    test('rechaza token firmado con secret incorrecto', () => {
      const fakeToken = jwt.sign(mockUser, 'wrong_secret');
      req.headers.authorization = `Bearer ${fakeToken}`;

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next.called()).toBe(false);
    });

    test('no modifica req.user si el token es inválido', () => {
      req.headers.authorization = 'Bearer token.invalido';

      authenticate(req, res, next);

      expect(req.user).toBeUndefined();
    });

    test('agrega información correcta del usuario a req.user', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toEqual({
        userId: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email
      });
    });
  });

  describe('optionalAuth middleware', () => {
    test('agrega usuario si el token es válido', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(next.called()).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser.userId);
    });

    test('continúa sin usuario si no hay token', () => {
      optionalAuth(req, res, next);

      expect(next.called()).toBe(true);
      expect(req.user).toBeUndefined();
      expect(res.statusCode).toBeNull();
    });

    test('continúa sin usuario si el token es inválido', () => {
      req.headers.authorization = 'Bearer token.invalido';

      optionalAuth(req, res, next);

      expect(next.called()).toBe(true);
      expect(req.user).toBeUndefined();
      expect(res.statusCode).toBeNull();
    });

    test('continúa sin usuario si el token está expirado', () => {
      const expiredToken = jwt.sign(mockUser, config.jwt.secret, {
        expiresIn: '-1s'
      });
      req.headers.authorization = `Bearer ${expiredToken}`;

      optionalAuth(req, res, next);

      expect(next.called()).toBe(true);
      expect(req.user).toBeUndefined();
      expect(res.statusCode).toBeNull();
    });

    test('no lanza error aunque el header esté malformado', () => {
      req.headers.authorization = 'MalformedHeader';

      expect(() => {
        optionalAuth(req, res, next);
      }).not.toThrow();

      expect(next.called()).toBe(true);
    });
  });

  describe('Casos edge', () => {
    test('maneja header authorization en minúsculas', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `bearer ${token}`; // minúsculas

      authenticate(req, res, next);

      // Como el código busca 'Bearer' con mayúscula, debería fallar
      expect(res.statusCode).toBe(401);
      expect(next.called()).toBe(false);
    });

    test('maneja header authorization con espacios extra', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer  ${token}`; // Doble espacio

      authenticate(req, res, next);

      // Esto debería incluir el espacio extra en el token y fallar
      expect(res.statusCode).toBe(401);
      expect(next.called()).toBe(false);
    });

    test('maneja token vacío después de Bearer', () => {
      req.headers.authorization = 'Bearer ';

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next.called()).toBe(false);
    });

    test('maneja múltiples llamadas al middleware', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);
      
      expect(next.called()).toBe(true);
      expect(req.user).toBeDefined();

      // Segunda llamada con el mismo req
      const next2 = createMockNext();
      authenticate(req, res, next2);
      
      expect(next2.called()).toBe(true);
    });
  });

  describe('Integración entre middlewares', () => {
    test('authenticate y optionalAuth manejan el mismo token válido', () => {
      const token = generateAccessToken(mockUser);
      req.headers.authorization = `Bearer ${token}`;

      // Primero con authenticate
      authenticate(req, res, next);
      expect(next.called()).toBe(true);
      const userFromAuth = req.user;

      // Reset para optionalAuth
      req.user = undefined;
      const next2 = createMockNext();

      // Luego con optionalAuth
      optionalAuth(req, res, next2);
      expect(next2.called()).toBe(true);

      // Ambos deberían agregar la misma información
      expect(req.user).toEqual(userFromAuth);
    });

    test('authenticate rechaza donde optionalAuth permite', () => {
      // Sin token
      authenticate(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(next.called()).toBe(false);

      // Reset
      const next2 = createMockNext();
      const res2 = createMockResponse();

      // optionalAuth permite continuar
      optionalAuth(req, res2, next2);
      expect(res2.statusCode).toBeNull();
      expect(next2.called()).toBe(true);
    });
  });
});

