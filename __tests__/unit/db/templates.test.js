import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

const { getAll } = await import('../../../src/db/templates.js');
const db = (await import('../../../src/config/database.js')).default;

describe('Templates DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debería devolver todas las plantillas y ordenar por id ASC', async () => {
      const mockRows = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' },
      ];
      db.query.mockResolvedValue({ rows: mockRows, rowCount: 2 });

      const result = await getAll();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM templates ORDER BY id ASC');
      expect(result).toEqual(mockRows);
    });

    it('debería devolver lista vacía si no hay plantillas', async () => {
      db.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await getAll();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM templates ORDER BY id ASC');
      expect(result).toEqual([]);
    });

    it('debería lanzar error si la db falla', async () => {
      const dbError = new Error('Database Error');
      db.query.mockRejectedValue(dbError);

      await expect(getAll()).rejects.toThrow('Database Error');
    });
  });
});