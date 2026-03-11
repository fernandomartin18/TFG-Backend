import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('../../../src/db/projects.js', () => ({
  getUserProjects: jest.fn(),
  getProjectChats: jest.fn(),
  createProject: jest.fn(),
  verifyProjectOwnership: jest.fn(),
  updateProjectName: jest.fn(),
  toggleProjectExpanded: jest.fn(),
  deleteProject: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/chats.js', () => ({
  verifyChatOwnership: jest.fn(),
  addChatToProject: jest.fn(),
  removeChatFromProject: jest.fn(),
}));

describe('Projects Controller', () => {
  let projectsController;
  let projectsDbMock;
  let chatsDbMock;

  beforeAll(async () => {
    projectsDbMock = await import('../../../src/db/projects.js');
    chatsDbMock = await import('../../../src/db/chats.js');
    projectsController = await import('../../../src/controllers/projects.controller.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockReq = (userId = 1, params = {}, body = {}) => ({
    user: { userId },
    params,
    body,
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getUserProjects', () => {
    it('debería obtener proyectos y sus chats', async () => {
      const req = mockReq(1);
      const res = mockRes();
      
      projectsDbMock.getUserProjects.mockResolvedValue([{ id: 1, name: 'Project 1' }]);
      projectsDbMock.getProjectChats.mockResolvedValue([{ id: 10, title: 'Chat 10' }]);

      await projectsController.getUserProjects(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 1, name: 'Project 1', chats: [{ id: 10, title: 'Chat 10' }] }
      ]);
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1);
      const res = mockRes();
      projectsDbMock.getUserProjects.mockRejectedValue(new Error('err'));

      await projectsController.getUserProjects(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createProject', () => {
    it('debería retornar 400 si el name esta vacio', async () => {
      const req = mockReq(1, {}, { name: '   ' });
      const res = mockRes();

      await projectsController.createProject(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería crear el proyecto exitosamente', async () => {
      const req = mockReq(1, {}, { name: 'New Proj' });
      const res = mockRes();
      projectsDbMock.createProject.mockResolvedValue({ id: 1, name: 'New Proj' });

      await projectsController.createProject(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'New Proj' });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, {}, { name: 'Valid' });
      const res = mockRes();
      projectsDbMock.createProject.mockRejectedValue(new Error('err'));

      await projectsController.createProject(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProjectName', () => {
    it('debería retornar 400 si el name esta vacio', async () => {
      const req = mockReq(1, { projectId: '1' }, { name: '' });
      const res = mockRes();

      await projectsController.updateProjectName(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería retornar 403 si el usuario no es el dueño', async () => {
      const req = mockReq(1, { projectId: '1' }, { name: 'Update' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(false);

      await projectsController.updateProjectName(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería actualizar el proyecto', async () => {
      const req = mockReq(1, { projectId: '1' }, { name: 'Update' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(true);
      projectsDbMock.updateProjectName.mockResolvedValue({ id: 1, name: 'Update' });

      await projectsController.updateProjectName(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Update' });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { projectId: '1' }, { name: 'Update' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockRejectedValue(new Error('err'));

      await projectsController.updateProjectName(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('toggleProjectExpanded', () => {
    it('debería retornar 403 si el usuario no es el dueño', async () => {
      const req = mockReq(1, { projectId: '1' }, { isExpanded: true });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(false);

      await projectsController.toggleProjectExpanded(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería actualizar el proyecto', async () => {
      const req = mockReq(1, { projectId: '1' }, { isExpanded: true });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(true);
      projectsDbMock.toggleProjectExpanded.mockResolvedValue({ id: 1, is_expanded: true });

      await projectsController.toggleProjectExpanded(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 1, is_expanded: true });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { projectId: '1' }, { isExpanded: true });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockRejectedValue(new Error('err'));

      await projectsController.toggleProjectExpanded(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteProject', () => {
    it('debería retornar 403 si el usuario no es el dueño', async () => {
      const req = mockReq(1, { projectId: '1' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(false);

      await projectsController.deleteProject(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería eliminar el proyecto', async () => {
      const req = mockReq(1, { projectId: '1' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(true);
      projectsDbMock.deleteProject.mockResolvedValue(true);

      await projectsController.deleteProject(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Proyecto eliminado exitosamente' });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { projectId: '1' });
      const res = mockRes();
      projectsDbMock.verifyProjectOwnership.mockRejectedValue(new Error('err'));

      await projectsController.deleteProject(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addChatToProject', () => {
    it('debería retornar 403 si no es dueño del chat', async () => {
      const req = mockReq(1, {}, { chatId: 10, projectId: 1 });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await projectsController.addChatToProject(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería retornar 403 si no es dueño del proyecto', async () => {
      const req = mockReq(1, {}, { chatId: 10, projectId: 1 });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(false);

      await projectsController.addChatToProject(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería añadir el chat al proyecto exitosamente', async () => {
      const req = mockReq(1, {}, { chatId: 10, projectId: 1 });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      projectsDbMock.verifyProjectOwnership.mockResolvedValue(true);
      chatsDbMock.addChatToProject.mockResolvedValue({ id: 10, project_id: 1 });

      await projectsController.addChatToProject(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 10, project_id: 1 });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, {}, { chatId: 10, projectId: 1 });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('err'));

      await projectsController.addChatToProject(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removeChatFromProject', () => {
    it('debería retornar 403 si no es dueño del chat', async () => {
      const req = mockReq(1, { chatId: '10' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(false);

      await projectsController.removeChatFromProject(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debería remover el chat del proyecto', async () => {
      const req = mockReq(1, { chatId: '10' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockResolvedValue(true);
      chatsDbMock.removeChatFromProject.mockResolvedValue({ id: 10, project_id: null });

      await projectsController.removeChatFromProject(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 10, project_id: null });
    });

    it('debería retornar 500 en caso de error', async () => {
      const req = mockReq(1, { chatId: '10' });
      const res = mockRes();
      chatsDbMock.verifyChatOwnership.mockRejectedValue(new Error('err'));

      await projectsController.removeChatFromProject(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
