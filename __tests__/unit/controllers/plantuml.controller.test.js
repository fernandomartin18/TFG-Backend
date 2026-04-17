import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/db/plantuml.js', () => ({
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const { getTemplates, createTemplate, updateTemplate, deleteTemplate } = await import('../../../src/controllers/plantuml.controller.js');
const plantumlDb = await import('../../../src/db/plantuml.js');

const mockReq = () => ({ body: {}, params: {} });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

describe('PlantUML Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('debería devolver plantillas con o sin usuario', async () => {
      plantumlDb.findAll.mockResolvedValue([{ id: 1 }]);
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await getTemplates(req, res, next);
      expect(plantumlDb.findAll).toHaveBeenCalledWith(null);
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, templates: [{ id: 1 }] });
    });
  });

  describe('createTemplate', () => {
    it('debería crear una plantilla de forma exitosa', async () => {
      plantumlDb.create.mockResolvedValue({ id: 1, title: 'T', code: '@enduml' });
      const req = mockReq();
      req.user = { userId: 5 };
      req.body = { title: 'T', code: '@enduml' };
      const res = mockRes();
      const next = mockNext();

      await createTemplate(req, res, next);
      expect(plantumlDb.create).toHaveBeenCalledWith('T', '@enduml', 5);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, template: { id: 1, title: 'T', code: '@enduml' } });
    });

    it('debería validar title y code', async () => {
      const req = mockReq();
      req.user = { userId: 5 };
      const res = mockRes();
      const next = mockNext();

      await createTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El título es obligatorio' });
    });
  });

  describe('updateTemplate', () => {
    it('debería actualizar una plantilla de forma exitosa', async () => {
      plantumlDb.update.mockResolvedValue({ id: 1, title: 'T' });
      const req = mockReq();
      req.user = { userId: 5 };
      req.params = { id: 1 };
      req.body = { title: 'T2', code: '@enduml' };
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);
      expect(plantumlDb.update).toHaveBeenCalledWith(1, 'T2', '@enduml', 5);
      expect(res.json).toHaveBeenCalledWith({ success: true, template: { id: 1, title: 'T' } });
    });

    it('devuelve 404 si la plantilla no existe', async () => {
      plantumlDb.update.mockResolvedValue(null);
      const req = mockReq();
      req.user = { userId: 5 };
      req.params = { id: 1 };
      req.body = { title: 'T2', code: '@enduml' };
      const res = mockRes();
      const next = mockNext();

      await updateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteTemplate', () => {
    it('debería borrar una plantilla', async () => {
      plantumlDb.remove.mockResolvedValue({ id: 1 });
      const req = mockReq();
      req.user = { userId: 5 };
      req.params = { id: 1 };
      const res = mockRes();
      const next = mockNext();

      await deleteTemplate(req, res, next);
      expect(plantumlDb.remove).toHaveBeenCalledWith(1, 5);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
