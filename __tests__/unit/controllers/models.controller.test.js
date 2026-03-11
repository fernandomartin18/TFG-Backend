import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/ollama.service.js', () => ({
  ollamaService: {
    listModels: jest.fn(),
    unloadModel: jest.fn(),
    getAutoSelectedModels: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  }
}));

describe('Models Controller', () => {
  let modelsController;
  let ollamaServiceMock;

  beforeAll(async () => {
    const ollamaModule = await import('../../../src/services/ollama.service.js');
    ollamaServiceMock = ollamaModule.ollamaService;
    
    const controllerModule = await import('../../../src/controllers/models.controller.js');
    modelsController = controllerModule.modelsController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (body = {}) => ({ body });
  
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('listModels', () => {
    it('debería listar los modelos exitosamente', async () => {
      const req = mockReq();
      const res = mockRes();
      ollamaServiceMock.listModels.mockResolvedValue(['modelA', 'modelB']);

      await modelsController.listModels(req, res);

      expect(ollamaServiceMock.listModels).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(['modelA', 'modelB']);
    });

    it('debería manejar errores de la lista de modelos', async () => {
      const req = mockReq();
      const res = mockRes();
      ollamaServiceMock.listModels.mockRejectedValue(new Error('err'));

      await modelsController.listModels(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('unloadModel', () => {
    it('debería retornar 400 si falta el nombre del modelo', async () => {
      const req = mockReq({});
      const res = mockRes();

      await modelsController.unloadModel(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería descargar el modelo exitosamente', async () => {
      const req = mockReq({ model: 'llama2' });
      const res = mockRes();
      ollamaServiceMock.unloadModel.mockResolvedValue({ success: true });

      await modelsController.unloadModel(req, res);
      expect(ollamaServiceMock.unloadModel).toHaveBeenCalledWith('llama2');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('debería manejar errores al descargar', async () => {
      const req = mockReq({ model: 'llama2' });
      const res = mockRes();
      ollamaServiceMock.unloadModel.mockRejectedValue(new Error('err'));

      await modelsController.unloadModel(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAutoSelectedModels', () => {
    it('debería obtener los modelos seleccionados auto', async () => {
      const req = mockReq();
      const res = mockRes();
      ollamaServiceMock.getAutoSelectedModels.mockResolvedValue({ chat: 'llama2', code: 'codellama' });

      await modelsController.getAutoSelectedModels(req, res);
      expect(res.json).toHaveBeenCalledWith({ chat: 'llama2', code: 'codellama' });
    });

    it('debería manejar errores al obtener auto models', async () => {
      const req = mockReq();
      const res = mockRes();
      ollamaServiceMock.getAutoSelectedModels.mockRejectedValue(new Error('err'));

      await modelsController.getAutoSelectedModels(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
