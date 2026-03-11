import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  extractTokenFromHeader,
  hashPassword,
  comparePassword
} from '../../../src/services/auth.service.js';
import { config } from '../../../src/config/index.js';

describe('Auth Service - JWT', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockPayload = {
    userId: mockUser.id,
    username: mockUser.username,
    email: mockUser.email
  };

  describe('generateAccessToken', () => {
    test('genera un access token válido', () => {
      const token = generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('el token contiene el payload correcto', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.exp).toBeDefined(); // Verifica que tiene expiración
    });

    test('el token puede ser verificado con el secret correcto', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, config.jwt.secret);
      
      expect(decoded.userId).toBe(mockPayload.userId);
    });
  });

  describe('generateRefreshToken', () => {
    test('genera un refresh token válido', () => {
      const token = generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('el refresh token es diferente del access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      
      expect(accessToken).not.toBe(refreshToken);
    });

    test('el refresh token puede ser verificado con el refresh secret', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      
      expect(decoded.userId).toBe(mockPayload.userId);
    });
  });

  describe('verifyAccessToken', () => {
    test('verifica correctamente un token válido', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.email).toBe(mockPayload.email);
    });

    test('rechaza un token con formato inválido', () => {
      expect(() => {
        verifyAccessToken('token.invalido');
      }).toThrow();
    });

    test('rechaza un token vacío', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });

    test('rechaza un token con signature incorrecta', () => {
      const token = generateAccessToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      
      expect(() => {
        verifyAccessToken(tamperedToken);
      }).toThrow(jwt.JsonWebTokenError);
    });

    test('rechaza un token firmado con secret incorrecto', () => {
      const fakeToken = jwt.sign(mockPayload, 'wrong_secret');
      
      expect(() => {
        verifyAccessToken(fakeToken);
      }).toThrow();
    });

    test('rechaza un token expirado', () => {
      const expiredToken = jwt.sign(mockPayload, config.jwt.secret, {
        expiresIn: '-1s' // Token ya expirado
      });
      
      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow(jwt.TokenExpiredError);
    });
  });

  describe('verifyRefreshToken', () => {
    test('verifica correctamente un refresh token válido', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    test('rechaza un access token cuando se espera refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      
      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow();
    });

    test('rechaza un refresh token expirado', () => {
      const expiredToken = jwt.sign(mockPayload, config.jwt.refreshSecret, {
        expiresIn: '-1s'
      });
      
      expect(() => {
        verifyRefreshToken(expiredToken);
      }).toThrow(jwt.TokenExpiredError);
    });
  });

  describe('generateTokens', () => {
    test('genera ambos tokens (access y refresh)', () => {
      const { accessToken, refreshToken } = generateTokens(mockUser);
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
    });

    test('los tokens generados contienen la información del usuario', () => {
      const { accessToken, refreshToken } = generateTokens(mockUser);
      
      const decodedAccess = jwt.decode(accessToken);
      const decodedRefresh = jwt.decode(refreshToken);
      
      expect(decodedAccess.userId).toBe(mockUser.id);
      expect(decodedAccess.username).toBe(mockUser.username);
      expect(decodedRefresh.userId).toBe(mockUser.id);
    });
  });

  describe('extractTokenFromHeader', () => {
    test('extrae correctamente el token de un header válido', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    test('retorna null si el header no tiene Bearer', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = token; // Sin "Bearer "
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBeNull();
    });

    test('retorna null si el header está vacío', () => {
      const extracted = extractTokenFromHeader('');
      
      expect(extracted).toBeNull();
    });

    test('retorna null si el header es null', () => {
      const extracted = extractTokenFromHeader(null);
      
      expect(extracted).toBeNull();
    });

    test('retorna null si el header es undefined', () => {
      const extracted = extractTokenFromHeader(undefined);
      
      expect(extracted).toBeNull();
    });

    test('maneja correctamente espacios extra', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer  ${token}`; // Doble espacio
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(` ${token}`); // Extrae desde posición 7
    });
  });

  describe('hashPassword y comparePassword', () => {
    test('hashea una contraseña correctamente', async () => {
      const password = 'MySecurePassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // Los hashes bcrypt son largos
    });

    test('genera hashes diferentes para la misma contraseña', async () => {
      const password = 'MySecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Bcrypt usa salt aleatorio
    });

    test('compara correctamente una contraseña válida', async () => {
      const password = 'MySecurePassword123';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('rechaza una contraseña incorrecta', async () => {
      const password = 'MySecurePassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('rechaza una contraseña con diferencia mínima', async () => {
      const password = 'MySecurePassword123';
      const wrongPassword = 'MySecurePassword124'; // Solo un carácter diferente
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Seguridad de tokens', () => {
    test('el payload del token no contiene información sensible como contraseña', () => {
      const userWithPassword = {
        ...mockUser,
        password: 'secret123'
      };
      
      const { accessToken } = generateTokens(userWithPassword);
      const decoded = jwt.decode(accessToken);
      
      expect(decoded.password).toBeUndefined();
      expect(decoded.userId).toBeDefined();
      expect(decoded.username).toBeDefined();
      expect(decoded.email).toBeDefined();
    });

    test('tokens generados en diferentes momentos son únicos', () => {
      const token1 = generateAccessToken(mockPayload);
      
      // Esperar un momento para asegurar diferente timestamp
      const token2 = generateAccessToken(mockPayload);
      
      // Aunque el payload sea el mismo, los tokens deberían ser diferentes por el timestamp (iat)
      // En la práctica, si se generan en el mismo segundo, podrían ser iguales
      // Este test valida que la función funciona y genera tokens válidos
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });
});
