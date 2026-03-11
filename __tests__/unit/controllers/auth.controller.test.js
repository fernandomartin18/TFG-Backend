import { jest } from '@jest/globals';

// Mocks de módulos deben declararse antes de importar el controlador
jest.unstable_mockModule('../../../src/db/index.js', () => ({
  users: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    getUserPasswordHash: jest.fn(),
    getUserById: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/auth.service.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

// Imports dinámicos DESPUÉS de declarar los mocks
const { register, login, refresh, getProfile, logout } = await import(
  '../../../src/controllers/auth.controller.js'
);
const { users } = await import('../../../src/db/index.js');
const { hashPassword, comparePassword, generateTokens, verifyRefreshToken } =
  await import('../../../src/services/auth.service.js');

// ─── Helpers ────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = function (c) { this.statusCode = c; return this; };
  res.json = function (d) { this.body = d; return this; };
  return res;
};

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ─── Register ───────────────────────────────────────────────────────────────
describe('register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea usuario y devuelve 201 con tokens', async () => {
    users.getUserByEmail.mockResolvedValue(null);
    users.createUser.mockResolvedValue(mockUser);
    hashPassword.mockResolvedValue('hashed');
    generateTokens.mockReturnValue({ accessToken: 'a', refreshToken: 'r' });

    const req = { body: { username: 'testuser', email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.user.id).toBe(1);
    expect(res.body.accessToken).toBe('a');
  });

  test('devuelve 409 si el email ya está registrado', async () => {
    users.getUserByEmail.mockResolvedValue(mockUser);

    const req = { body: { username: 'testuser', email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('El email ya está registrado');
  });

  test('devuelve 409 si la DB lanza error de duplicado (23505)', async () => {
    users.getUserByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed');
    const dbError = new Error('duplicate');
    dbError.code = '23505';
    users.createUser.mockRejectedValue(dbError);

    const req = { body: { username: 'testuser', email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.statusCode).toBe(409);
  });

  test('devuelve 500 en error inesperado', async () => {
    users.getUserByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed');
    users.createUser.mockRejectedValue(new Error('DB down'));

    const req = { body: { username: 'testuser', email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.statusCode).toBe(500);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────
describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve tokens en login correcto', async () => {
    users.getUserPasswordHash.mockResolvedValue({ ...mockUser, password_hash: 'hashed' });
    comparePassword.mockResolvedValue(true);
    users.getUserById.mockResolvedValue(mockUser);
    generateTokens.mockReturnValue({ accessToken: 'a', refreshToken: 'r' });

    const req = { body: { email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await login(req, res);

    expect(res.statusCode).toBeNull(); // 200 implícito (no llama a res.status)
    expect(res.body.accessToken).toBe('a');
    expect(res.body.user.username).toBe('testuser');
  });

  test('devuelve 401 si el usuario no existe', async () => {
    users.getUserPasswordHash.mockResolvedValue(null);

    const req = { body: { email: 'noexiste@example.com', password: 'Pass123' } };
    const res = mockRes();

    await login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  test('devuelve 401 si la contraseña es incorrecta', async () => {
    users.getUserPasswordHash.mockResolvedValue({ ...mockUser, password_hash: 'hashed' });
    comparePassword.mockResolvedValue(false);

    const req = { body: { email: 'test@example.com', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.statusCode).toBe(401);
  });

  test('devuelve 500 en error inesperado', async () => {
    users.getUserPasswordHash.mockRejectedValue(new Error('DB error'));

    const req = { body: { email: 'test@example.com', password: 'Pass123' } };
    const res = mockRes();

    await login(req, res);

    expect(res.statusCode).toBe(500);
  });
});

// ─── Refresh ─────────────────────────────────────────────────────────────────
describe('refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renueva tokens correctamente', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 1 });
    users.getUserById.mockResolvedValue(mockUser);
    generateTokens.mockReturnValue({ accessToken: 'new-a', refreshToken: 'new-r' });

    const req = { body: { refreshToken: 'valid-refresh' } };
    const res = mockRes();

    await refresh(req, res);

    expect(res.body.accessToken).toBe('new-a');
    expect(res.body.message).toBe('Tokens renovados exitosamente');
  });

  test('devuelve 401 si el usuario ya no existe', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 99 });
    users.getUserById.mockResolvedValue(null);

    const req = { body: { refreshToken: 'valid-refresh' } };
    const res = mockRes();

    await refresh(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Usuario no encontrado');
  });

  test('devuelve 401 si el token está expirado', async () => {
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    verifyRefreshToken.mockImplementation(() => { throw err; });

    const req = { body: { refreshToken: 'expired-token' } };
    const res = mockRes();

    await refresh(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Refresh token expirado');
  });

  test('devuelve 401 si el token es inválido', async () => {
    const err = new Error('invalid');
    err.name = 'JsonWebTokenError';
    verifyRefreshToken.mockImplementation(() => { throw err; });

    const req = { body: { refreshToken: 'bad-token' } };
    const res = mockRes();

    await refresh(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Refresh token inválido');
  });

  test('devuelve 500 en error inesperado', async () => {
    verifyRefreshToken.mockImplementation(() => { throw new Error('unexpected'); });

    const req = { body: { refreshToken: 'token' } };
    const res = mockRes();

    await refresh(req, res);

    expect(res.statusCode).toBe(500);
  });
});

// ─── getProfile ───────────────────────────────────────────────────────────────
describe('getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve el perfil del usuario autenticado', async () => {
    users.getUserById.mockResolvedValue(mockUser);

    const req = { user: { userId: 1 } };
    const res = mockRes();

    await getProfile(req, res);

    expect(res.body.user.id).toBe(1);
    expect(res.body.user.username).toBe('testuser');
  });

  test('devuelve 404 si el usuario no existe', async () => {
    users.getUserById.mockResolvedValue(null);

    const req = { user: { userId: 99 } };
    const res = mockRes();

    await getProfile(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
  });

  test('devuelve 500 en error inesperado', async () => {
    users.getUserById.mockRejectedValue(new Error('DB error'));

    const req = { user: { userId: 1 } };
    const res = mockRes();

    await getProfile(req, res);

    expect(res.statusCode).toBe(500);
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────
describe('logout', () => {
  test('cierra sesión correctamente', async () => {
    const req = { user: { userId: 1, username: 'testuser' } };
    const res = mockRes();

    await logout(req, res);

    expect(res.body.message).toBe('Sesión cerrada exitosamente');
  });
});
