import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/db/templates.js', () => ({
  getAllForUser: jest.fn(),
  getPublicTemplates: jest.fn(),
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
    it('debería obtener y devolver las plantillas públicas si no hay usuario', async () => {
      const mockTemplates = [{ id: 1, title: 'Public Template' }];
      templatesDb.getPublicTemplates.mockResolvedValue(mockTemplates);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);

      expect(templatesDb.getPublicTemplates).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería obtener plantillas completas si hay usuario en req', async () => {
      const mockTemplates = [{ id: 1, title: 'User Template' }];
      templatesDb.getAllForUser.mockResolvedValue(mockTemplates);

      const req = mockReq();
      req.user = { userId: 42 };
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);

      expect(templatesDb.getAllForUser).toHaveBeenCalledWith(42);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería manejar errores y pasarlos al middleware de error (next)', async () => {
      const dbError = new Error('Database Error');
      templatesDb.getPublicTemplates.mockRejectedValue(dbError);

      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);

      expect(templatesDb.getPublicTemplates).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Error al obtener plantillas:', dbError);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
