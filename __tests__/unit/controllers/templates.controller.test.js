import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/db/templates.js', () => ({
  getAllForUser: jest.fn(),
  getPublicTemplates: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} = await import('../../../src/controllers/templates.controller.js');
const templatesDb = await import('../../../src/db/templates.js');
const { logger } = await import('../../../src/utils/logger.js');

const mockReq = () => ({});

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
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

      expect(logger.error).toHaveBeenCalledWith('Error al obtener plantillas:', dbError);
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('createTemplate', () => {
    it('debería retornar 400 si faltan title o prompt', async () => {
      const req = mockReq();
      req.user = { userId: 1 };
      req.body = { title: 'Solo titulo' }; // Falta prompt
      const res = mockRes();
      const next = mockNext();

      await createTemplate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Título y prompt son obligatorios' });
    });

    it('debería crear el template exitosamente', async () => {
      const newTemp = { id: 10, title: 'T1', prompt: 'P1' };
      templatesDb.create.mockResolvedValue(newTemp);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.body = { title: 'T1', prompt: 'P1' };
      const res = mockRes();
      const next = mockNext();

      await createTemplate(req, res, next);

      expect(templatesDb.create).toHaveBeenCalledWith(1, 'T1', 'P1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newTemp);
    });

    it('debería manejar errores al crear y propagar a next', async () => {
      const error = new Error('Creation Error');
      templatesDb.create.mockRejectedValue(error);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.body = { title: 'T1', prompt: 'P1' };
      const res = mockRes();
      const next = mockNext();

      await createTemplate(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error al crear plantilla:', error);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTemplate', () => {
    it('debería retornar 400 si faltan title o prompt', async () => {
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      req.body = { prompt: 'Solo prompt' }; // Falta title
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Título y prompt son obligatorios' });
    });

    it('debería retornar 404 si la plantilla no es encontrada o actualizable', async () => {
      templatesDb.update.mockResolvedValue(null);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      req.body = { title: 'T updated', prompt: 'P updated' };
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Plantilla no encontrada o no autorizada' });
    });

    it('debería actualizar la plantilla exitosamente', async () => {
      const updatedTemp = { id: 10, title: 'T updated', prompt: 'P updated' };
      templatesDb.update.mockResolvedValue(updatedTemp);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      req.body = { title: 'T updated', prompt: 'P updated' };
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);

      expect(templatesDb.update).toHaveBeenCalledWith(10, 1, 'T updated', 'P updated');
      expect(res.json).toHaveBeenCalledWith(updatedTemp);
    });

    it('debería manejar errores al actualizar y propagar a next', async () => {
      const error = new Error('Update Error');
      templatesDb.update.mockRejectedValue(error);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      req.body = { title: 'T', prompt: 'P' };
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error al actualizar plantilla:', error);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteTemplate', () => {
    it('debería retornar 404 si la plantilla no es encontrada o borrable', async () => {
      templatesDb.remove.mockResolvedValue(false);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      const res = mockRes();
      const next = mockNext();

      await deleteTemplate(req, res, next);

      expect(templatesDb.remove).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Plantilla no encontrada o no autorizada' });
    });

    it('debería borrar la plantilla de usuario exitosamente', async () => {
      templatesDb.remove.mockResolvedValue(true);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      const res = mockRes();
      const next = mockNext();

      await deleteTemplate(req, res, next);

      expect(templatesDb.remove).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('debería manejar errores y pasarlos a next', async () => {
      const error = new Error('Delete Error');
      templatesDb.remove.mockRejectedValue(error);
      
      const req = mockReq();
      req.user = { userId: 1 };
      req.params = { id: 10 };
      const res = mockRes();
      const next = mockNext();

      await deleteTemplate(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error al eliminar plantilla:', error);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
