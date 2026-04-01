import { jest } from '@jest/globals';

jest.unstable_mockModule('axios', () => {
  return {
    default: {
      get: jest.fn(),
      post: jest.fn()
    }
  };
});

jest.unstable_mockModule('form-data', () => {
  return {
    default: class FormData {
      constructor() {
        this.data = new Map();
      }
      append(key, value, options) {
        this.data.set(key, { value, options });
      }
      getHeaders() {
        return { 'content-type': 'multipart/form-data' };
      }
    }
  };
});

const axios = (await import('axios')).default;
const { ollamaService } = await import('../../../src/services/ollama.service.js');

describe('OllamaService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('debería devolver la lista de modelos', async () => {
      const mockResult = { models: [{ name: 'test-model' }] };
      axios.get.mockResolvedValue({ data: mockResult });

      const res = await ollamaService.listModels();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/models/'), expect.any(Object));
      expect(res).toEqual(mockResult);
    });

    it('debería manejar errores de red (sin respuesta)', async () => {
      const error = new Error('Network Error');
      error.request = {};
      axios.get.mockRejectedValue(error);

      await expect(ollamaService.listModels()).rejects.toEqual(expect.objectContaining({ type: 'CONNECTION_ERROR' }));
    });

    it('debería manejar errores de respuesta HTTP', async () => {
      const error = new Error('HTTP Error');
      error.response = { status: 400, data: { detail: 'Bad Request' } };
      axios.get.mockRejectedValue(error);

      await expect(ollamaService.listModels()).rejects.toEqual(expect.objectContaining({ type: 'FASTAPI_ERROR', status: 400 }));
    });

    it('debería manejar otros errores', async () => {
      const error = new Error('Other Error');
      axios.get.mockRejectedValue(error);

      await expect(ollamaService.listModels()).rejects.toEqual(expect.objectContaining({ type: 'REQUEST_ERROR' }));
    });
  });

  describe('generateCode', () => {
    it('debería generar código sin imágenes', async () => {
      const mockResult = { result: 'const a = 1;' };
      axios.post.mockResolvedValue({ data: mockResult });

      const res = await ollamaService.generateCode('model', 'prompt');
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/generate/'), expect.any(Object), expect.any(Object));
      expect(res).toEqual(mockResult);
    });

    it('debería generar código con imágenes', async () => {
      const mockResult = { result: 'const b = 2;' };
      axios.post.mockResolvedValue({ data: mockResult });

      const images = [{ buffer: Buffer.from('test'), mimetype: 'image/png' }];
      const res = await ollamaService.generateCode('model', 'prompt', images);
      
      expect(axios.post).toHaveBeenCalled();
      expect(res).toEqual(mockResult);
    });
  });

  describe('generateCodeStream', () => {
    it('debería generar flujo de código estándar', async () => {
      const mockStream = { on: jest.fn() };
      axios.post.mockResolvedValue({ data: mockStream });

      const res = await ollamaService.generateCodeStream('model', 'prompt');
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/generate/stream'), expect.any(Object), expect.objectContaining({ responseType: 'stream' }));
      expect(res).toEqual(mockStream);
    });

    it('debería soportar historial e imágenes y autoMode', async () => {
      const mockStream = { on: jest.fn() };
      axios.post.mockResolvedValue({ data: mockStream });

      const images = [{ buffer: Buffer.from('test'), mimetype: 'image/png' }];
      const res = await ollamaService.generateCodeStream('model', 'prompt', images, [{ role: 'user', content: 'hi' }], true);
      
      expect(axios.post).toHaveBeenCalled();
      expect(res).toEqual(mockStream);
    });
  });

  describe('unloadModel', () => {
    it('debería descargar el modelo', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      const res = await ollamaService.unloadModel('test-model');
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/models/unload'), { model: 'test-model' }, expect.any(Object));
      expect(res).toEqual({ success: true });
    });
  });

  describe('getAutoSelectedModels', () => {
    it('debería obtener modelos auto-seleccionados', async () => {
      const mockData = { vision_model: 'v-model', coding_model: 'c-model' };
      axios.get.mockResolvedValue({ data: mockData });
      
      const res = await ollamaService.getAutoSelectedModels();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/models/auto-select'), expect.any(Object));
      expect(res).toEqual(mockData);
    });
  });
});
