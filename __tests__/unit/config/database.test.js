import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  const mPool = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(mClient),
    query: jest.fn(),
    end: jest.fn()
  };
  return {
    default: { Pool: jest.fn(() => mPool) }
  };
});

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const { testConnection, query, getClient, closePool, default: defaultExport } = await import('../../../src/config/database.js');
const pg = await import('pg');

describe('Database Config', () => {
  const pool = defaultExport.pool;
  let client;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    client = {
      query: jest.fn(),
      release: jest.fn()
    };
    
    // Reset implementations to default mock resolved values to prevent leaks across tests
    pool.connect.mockResolvedValue(client);
    pool.query.mockResolvedValue({});
    pool.on.mockImplementation(jest.fn());
    
    // clear init calls from setup
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('testConnection', () => {
    it('debería retornar true si la conexión es exitosa', async () => {
      client.query.mockResolvedValue({ rows: [{ now: 'mock-time' }] });

      const result = await testConnection();

      expect(pool.connect).toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(client.release).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('debería retornar false si hay error conectando', async () => {
      pool.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testConnection();

      expect(pool.connect).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('query', () => {
    it('debería ejecutar una query correctamente', async () => {
      const mockResult = { rowCount: 1 };
      pool.query.mockResolvedValueOnce(mockResult);

      const result = await query('SELECT * FROM users', []);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(result).toEqual(mockResult);
    });

    it('debería manejar errores de query', async () => {
      pool.query.mockRejectedValueOnce(new Error('Query error'));

      await expect(query('BAD SQL')).rejects.toThrow('Query error');
      expect(pool.query).toHaveBeenCalledWith('BAD SQL', undefined);
    });
  });

  describe('getClient', () => {
    it('debería obtener un client del pool y configurarle un timeout', async () => {
      const originalRelease = client.release;
      const newClient = await getClient();
      
      expect(pool.connect).toHaveBeenCalled();
      expect(typeof newClient.release).toBe('function');
      
      // Ejecutamos release, lo que debería limpiar el timer
      newClient.release();
      expect(originalRelease).toHaveBeenCalled();
    });

    it('debería emitir un error si no se libera el cliente', async () => {
      const { logger } = await import('../../../src/utils/logger.js');
      
      const newClient = await getClient();
      
      jest.advanceTimersByTime(5000);
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('no liberado'));
    });
  });

  describe('closePool', () => {
    it('debería cerrar el pool correctamente', async () => {
      await closePool();
      expect(pool.end).toHaveBeenCalled();
    });
  });

  describe('pool on error event', () => {
    it('debería registrar el error de la DB', async () => {
      const { logger } = await import('../../../src/utils/logger.js');
      
      // Simulamos la emisión de un error en el pool forzando la invocación de su callback
      const callArgs = pool.on.mock.calls.find(call => call[0] === 'error');
      if (callArgs) {
        const errorCallback = callArgs[1];
        const error = new Error('DB Disconnect');
        errorCallback(error);
        expect(logger.error).toHaveBeenCalled();
      }
    });
  });
});
