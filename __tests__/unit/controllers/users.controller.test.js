import { jest } from '@jest/globals';

const dbUsersMock = {
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByUsername: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserPasswordHashById: jest.fn(),
  updateUserPassword: jest.fn()
};

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  default: {
    users: dbUsersMock
  },
  users: dbUsersMock
}));

const authServiceMock = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn()
};

jest.unstable_mockModule('../../../src/services/auth.service.js', () => ({
  default: authServiceMock,
  authService: authServiceMock,
  hashPassword: authServiceMock.hashPassword,
  comparePassword: authServiceMock.comparePassword,
  generateToken: authServiceMock.generateToken
}));

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn()
};

jest.unstable_mockModule('bcrypt', () => ({
  default: bcryptMock,
  ...bcryptMock
}));

const usersController = await import('../../../src/controllers/users.controller.js');

describe('Users Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      req.params.id = 1;
      const mockUser = { id: 1, username: 'Test', email: 't@e.com', avatar_url: null, created_at: 'now', updated_at: 'now' };
      dbUsersMock.getUserById.mockResolvedValue(mockUser);

      await usersController.getUserById(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 1, username: 'Test', email: 't@e.com', avatarUrl: null, createdAt: 'now', updatedAt: 'now'
        }
      });
    });

    it('should return 404 if user not found', async () => {
      req.params.id = 999;
      dbUsersMock.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('should handle errors and return 500', async () => {
      req.params.id = 1;
      dbUsersMock.getUserById.mockRejectedValue(new Error('DB Error'));

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Error al obtener el usuario' }));
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user if found', async () => {
      req.params.username = 'testuser';
      const mockUser = { id: 1, username: 'testuser', email: 't@e.com', avatar_url: null, created_at: 'now', updated_at: 'now' };
      dbUsersMock.getUserByUsername.mockResolvedValue(mockUser);

      await usersController.getUserByUsername(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors and return 500', async () => {
      req.params.username = 't';
      dbUsersMock.getUserByUsername.mockRejectedValue(new Error('DB Error'));

      await usersController.getUserByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createUser', () => {
    it('should create a new user and return 201', async () => {
      req.body = { username: 'Test', email: 'test@example.com', password: 'password123' };
      dbUsersMock.getUserByEmail.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashedPassword');
      
      const newUser = { id: 1, username: 'Test', email: 'test@example.com', avatar_url: null, created_at: 'now', updated_at: 'now' };
      dbUsersMock.createUser.mockResolvedValue(newUser);

      await usersController.createUser(req, res);

      expect(dbUsersMock.createUser).toHaveBeenCalledWith({
        username: 'Test',
        email: 'test@example.com',
        avatarUrl: null,
        passwordHash: 'hashedPassword'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario creado exitosamente',
        user: expect.any(Object)
      });
    });

    it('should return 400 if missing fields', async () => {
      req.body = { username: 'test' };
      
      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if invalid email', async () => {
        req.body = { username: 'test', email: 'bademail', password: 'password123' };
        
        await usersController.createUser(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if password too short', async () => {
        req.body = { username: 'test', email: 'test@example.com', password: '123' };
        
        await usersController.createUser(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if email is already in use', async () => {
      req.body = { username: 'Test', email: 'test@example.com', password: 'password123' };
      dbUsersMock.getUserByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle errors and return 500', async () => {
      req.body = { username: 'Test', email: 'test@example.com', password: 'password123' };
      dbUsersMock.getUserByEmail.mockRejectedValue(new Error('DB Error'));

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUser', () => {
    it('should update user and return 200', async () => {
      req.user.userId = 1;
      req.body = { username: 'UpdatedName', email: 'updated@example.com', avatarUrl: 'url' };
      
      dbUsersMock.getUserByEmail.mockResolvedValue(null);
      
      const updatedUser = { id: 1, username: 'UpdatedName', email: 'updated@example.com', avatar_url: 'url' };
      dbUsersMock.updateUser.mockResolvedValue(updatedUser);

      await usersController.updateUser(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if no body provided', async () => {
        req.user.userId = 1;
        req.body = {};
        
        await usersController.updateUser(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if email is already in use by another user', async () => {
      req.user.userId = 1;
      req.body = { username: 'test', email: 'existing@example.com' };
      
      dbUsersMock.getUserByEmail.mockResolvedValue({ id: 2, email: 'existing@example.com' });

      await usersController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 404 if user not found to update', async () => {
      req.user.userId = 999;
      req.body = { username: 'Updated Name', email: 'e@e.com' };
      dbUsersMock.getUserByEmail.mockResolvedValue(null);
      dbUsersMock.updateUser.mockResolvedValue(null);

      await usersController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors and return 500', async () => {
      req.user.userId = 1;
      req.body = { username: 'Updated Name', email: 'e@e.com' };
      dbUsersMock.getUserByEmail.mockRejectedValue(new Error('DB Error'));

      await usersController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return 200', async () => {
      req.user = { userId: 1, username: 'test' };
      dbUsersMock.deleteUser.mockResolvedValue({ id: 1 });

      await usersController.deleteUser(req, res);

      expect(dbUsersMock.deleteUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        req.user = { userId: 999, username: 'test' };
        dbUsersMock.deleteUser.mockResolvedValue(null);
  
        await usersController.deleteUser(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
      });

    it('should handle errors and return 500', async () => {
        req.user = { userId: 1, username: 'test' };
        dbUsersMock.deleteUser.mockRejectedValue(new Error('DB Error'));

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      req.user = { userId: 1 };
      req.body = { currentPassword: 'oldPassword123', newPassword: 'newPassword123' };
      
      const userHash = { password_hash: 'hashedOldPassword' };
      dbUsersMock.getUserPasswordHashById.mockResolvedValue(userHash);
      
      authServiceMock.comparePassword.mockResolvedValueOnce(true); // current passes
      authServiceMock.comparePassword.mockResolvedValueOnce(false); // new is not the same
      authServiceMock.hashPassword.mockResolvedValue('hashedNewPassword');
      
      dbUsersMock.updateUserPassword.mockResolvedValue(true);

      await usersController.changePassword(req, res);

      expect(authServiceMock.hashPassword).toHaveBeenCalledWith('newPassword123');
      expect(dbUsersMock.updateUserPassword).toHaveBeenCalledWith(1, 'hashedNewPassword');
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should return 401 if current password is wrong', async () => {
        req.user = { userId: 1 };
        req.body = { currentPassword: 'old', newPassword: 'new' };
        
        dbUsersMock.getUserPasswordHashById.mockResolvedValue({ password_hash: 'hash' });
        authServiceMock.comparePassword.mockResolvedValueOnce(false);
  
        await usersController.changePassword(req, res);
  
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      req.user = { userId: 1 };
      req.body = { currentPassword: 'oldPassword123', newPassword: 'newPassword123' };
      
      dbUsersMock.getUserPasswordHashById.mockRejectedValue(new Error('DB Error'));

      await usersController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
