import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/db/templates.js', () => ({
  getAll: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const { getTemplates } = await import('../../../src/controllers/templates.controller.js');
const templatesDb = await import('../../../src/db/templates.js');
const { logger } = await import('../../../src/utils/logger.js');

const mockReq = () => ({});

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('Templates Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('debería obtener y devolver todas las plantillas correctamente', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template 1', description: 'Desc 1', prompt: 'Prompt 1' },
        { id: 2, name: 'Template 2', description: 'Desc 2', prompt: 'Prompt 2' },
      ];
      templatesDb.getAll.mockResolvedValue(mockTemplates);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);

      expect(templatesDb.getAll).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería manejar errores y pasarlos al middleware be error (next)', async () => {
      const dbError = new Error('Database Error');
      templatesDb.getAll.mockRejectedValue(dbError);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);

      expect(templatesDb.getAll).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Error al obtener plantillas:', dbError);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});