import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
}));

const { create, update, remove, findAll } = await import('../../../src/db/plantuml.js');
const db = await import('../../../src/config/database.js');

describe('PlantUML DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería insertar y devolver una nueva plantilla', async () => {
      const mockRow = { id: 1, title: 'T1', code: 'C1', userId: 2 };
      db.query.mockResolvedValue({ rows: [mockRow] });

      const result = await create('T1', 'C1', 2);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRow);
    });
  });

  describe('update', () => {
    it('debería actualizar y devolver la plantilla', async () => {
      const mockRow = { id: 1, title: 'T1-up', code: 'C1-up', userId: 2 };
      db.query.mockResolvedValue({ rows: [mockRow] });

      const result = await update(1, 'T1-up', 'C1-up', 2);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRow);
    });
  });

  describe('remove', () => {
    it('debería borrar y devolver la plantilla borrada', async () => {
      const mockRow = { id: 1 };
      db.query.mockResolvedValue({ rows: [mockRow] });

      const result = await remove(1, 2);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRow);
    });
  });

  describe('findAll', () => {
    it('debería obtener plantillas públicas si no hay userId', async () => {
      const mockRows = [{ id: 1, title: 'Public', code: 'C' }];
      db.query.mockResolvedValue({ rows: mockRows });

      const result = await findAll(null);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][0]).toContain('WHERE t.user_id IS NULL');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Public');
    });

    it('debería obtener plantillas públicas y del usuario', async () => {
      const mockRows = [{ id: 1, title: 'User Template', code: 'C' }];
      db.query.mockResolvedValue({ rows: mockRows });

      const result = await findAll(2);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][0]).toContain('OR t.user_id = $1');
      expect(db.query.mock.calls[0][1]).toEqual([2]);
    });
  });
});
