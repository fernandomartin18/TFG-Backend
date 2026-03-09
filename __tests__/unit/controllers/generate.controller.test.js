import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/ollama.service.js', () => ({
  ollamaService: {
    generateCode: jest.fn(),
    generateCodeStream: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../src/config/index.js', () => ({
  config: {
    upload: {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    }
  }
}));

describe('Generate Controller', () => {
  let generateController;
  let ollamaServiceMock;

  beforeAll(async () => {
    const ollamaModule = await import('../../../src/services/ollama.service.js');
    ollamaServiceMock = ollamaModule.ollamaService;

    const controllerModule = await import('../../../src/controllers/generate.controller.js');
    generateController = controllerModule.generateController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = (body = {}, files = []) => {
    const req = {
      body,
      files,
      on: jest.fn(),
    };
    return req;
  };

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    res.write = jest.fn();
    res.end = jest.fn();
    return res;
  };

  describe('generate', () => {
    it('debería retornar 400 si faltan model o prompt', async () => {
      const req = mockReq({ model: 'llama' }); // missing prompt
      const res = mockRes();

      await generateController.generate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 400 si hay mas de 5 imagenes', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' }, [1,2,3,4,5,6]);
      const res = mockRes();

      await generateController.generate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Máximo 5') }));
    });

    it('debería retornar 400 si la imagen no tiene un mime type permitido', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' }, [{ mimetype: 'image/gif' }]);
      const res = mockRes();

      await generateController.generate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 400 si el tamaño de la imagen es excesivo', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' }, [{ mimetype: 'image/jpeg', size: 10 * 1024 * 1024 }]);
      const res = mockRes();

      await generateController.generate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería generar código exitosamente', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' }, []);
      const res = mockRes();
      
      ollamaServiceMock.generateCode.mockResolvedValue({ code: 'console.log("hi")' });

      await generateController.generate(req, res);
      expect(ollamaServiceMock.generateCode).toHaveBeenCalledWith('llama', 'test', []);
      expect(res.json).toHaveBeenCalledWith({ code: 'console.log("hi")' });
    });

    it('debería manejar errores de servicio', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' }, []);
      const res = mockRes();
      
      ollamaServiceMock.generateCode.mockRejectedValue(new Error('service error'));

      await generateController.generate(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateStream', () => {
    it('debería retornar 400 si faltan model o prompt', async () => {
      const req = mockReq({ model: 'llama' });
      const res = mockRes();

      await generateController.generateStream(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería configurar res headers y llamar pip a res', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test', messages: '[]' });
      const res = mockRes();

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
        destroy: jest.fn()
      };
      ollamaServiceMock.generateCodeStream.mockResolvedValue(mockStream);

      await generateController.generateStream(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('debería manejar errores iniciando stream', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' });
      const res = mockRes();
      
      ollamaServiceMock.generateCodeStream.mockRejectedValue(new Error('service error'));

      await generateController.generateStream(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    
    it('debería manejar cierre del cliente de manera limpia', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' });
      const res = mockRes();

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
        destroy: jest.fn()
      };
      
      ollamaServiceMock.generateCodeStream.mockResolvedValue(mockStream);
      await generateController.generateStream(req, res);
      
      // Simular on close
      const closeHandler = req.on.mock.calls.find(call => call[0] === 'close')[1];
      closeHandler();
      expect(mockStream.destroy).toHaveBeenCalled();
    });

    it('debería manejar errores del stream y reportarlo con SSE format via stream.on(error)', async () => {
      const req = mockReq({ model: 'llama', prompt: 'test' });
      const res = mockRes();

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(), 
        destroy: jest.fn()
      };
      
      ollamaServiceMock.generateCodeStream.mockResolvedValue(mockStream);
      await generateController.generateStream(req, res);
      
      // Simular throw de error en stream emit
      const errorHandler = mockStream.on.mock.calls.find(call => call[0] === 'error')[1];
      errorHandler(new Error('stream error'));
      expect(res.write).toHaveBeenCalledWith('data: [ERROR] stream error\n\n');
      expect(res.end).toHaveBeenCalled();
    });
  });
});
