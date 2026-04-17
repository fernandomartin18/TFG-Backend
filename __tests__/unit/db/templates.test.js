import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  default: {
    query: jest.fn(),
  },
}));

const { getAllForUser, getPublicTemplates, create, update, remove } = await import('../../../src/db/templates.js');
const db = (await import('../../../src/config/database.js')).default;

describe('Templates DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllForUser', () => {
    it('debería devolver las plantillas del usuario y públicas', async () => {
      const mockRows = [{ id: 1 }];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await getAllForUser(1);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM templates WHERE user_id IS NULL OR user_id = $1 ORDER BY user_id NULLS FIRST, id ASC',
        [1]
      );
      expect(result).toEqual(mockRows);
    });
  });

  describe('getPublicTemplates', () => {
    it('debería devolver las plantillas públicas', async () => {
      const mockRows = [{ id: 2 }];
      db.query.mockResolvedValue({ rows: mockRows });
      const result = await getPublicTemplates();
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM templates WHERE user_id IS NULL ORDER BY id ASC');
      expect(result).toEqual(mockRows);
    });
  });

  // Basic tests for create, update, remove could be added.
});
