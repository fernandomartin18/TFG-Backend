import { validationResult } from 'express-validator';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation
} from '../../../src/middlewares/validators.js';

//Helper para ejecutar validaciones y obtener errores

const validateRequest = async (validations, body) => {
  const req = { body };
  const res = {};
  
  // Ejecutar todas las validaciones
  for (const validation of validations) {
    await validation.run(req);
  }
  
  // Obtener resultado de las validaciones
  const errors = validationResult(req);
  return errors;
};

describe('Validación de Email', () => {
  describe('registerValidation - Email', () => {
    test('rechaza email sin @', async () => {
      const body = {
        username: 'testuser',
        email: 'emailinvalido.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.msg).toBe('Debe ser un email válido');
    });

    test('rechaza email vacío', async () => {
      const body = {
        username: 'testuser',
        email: '',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeDefined();
    });

    test('rechaza email sin dominio', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.msg).toBe('Debe ser un email válido');
    });

    test('rechaza email sin usuario', async () => {
      const body = {
        username: 'testuser',
        email: '@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeDefined();
    });

    test('acepta email válido simple', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeUndefined();
    });

    test('acepta email válido con subdominios', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@mail.dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeUndefined();
    });

    test('acepta email válido con puntos', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario.prueba@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeUndefined();
    });
  });

  describe('loginValidation - Email', () => {
    test('rechaza email sin @', async () => {
      const body = {
        email: 'emailinvalido.com',
        password: 'cualquiera'
      };
      
      const errors = await validateRequest(loginValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.msg).toBe('Debe ser un email válido');
    });

    test('acepta email válido', async () => {
      const body = {
        email: 'usuario@dominio.com',
        password: 'cualquiera'
      };
      
      const errors = await validateRequest(loginValidation, body);
      
      const emailError = errors.array().find(err => err.path === 'email');
      expect(emailError).toBeUndefined();
    });
  });
});

describe('Validación de Contraseña', () => {
  describe('registerValidation - Password', () => {
    test('rechaza contraseña vacía', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: ''
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
    });

    test('rechaza contraseña menor a 6 caracteres', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'Abc12'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    test('rechaza contraseña de 1 carácter', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'A'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
    });

    test('rechaza contraseña sin mayúsculas', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toBe('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
    });

    test('rechaza contraseña sin minúsculas', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'PASSWORD123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toBe('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
    });

    test('rechaza contraseña sin números', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'PasswordSolo'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toBe('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
    });

    test('acepta contraseña válida con 6 caracteres', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'Pass12'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeUndefined();
    });

    test('acepta contraseña válida larga', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'Password123456'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeUndefined();
    });

    test('acepta contraseña válida con caracteres especiales', async () => {
      const body = {
        username: 'testuser',
        email: 'usuario@dominio.com',
        password: 'Pass123!@#'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const passwordError = errors.array().find(err => err.path === 'password');
      expect(passwordError).toBeUndefined();
    });
  });

  describe('changePasswordValidation - Password', () => {
    test('rechaza nueva contraseña corta', async () => {
      const body = {
        currentPassword: 'OldPass123',
        newPassword: 'Ab1',
        confirmPassword: 'Ab1'
      };
      
      const errors = await validateRequest(changePasswordValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toBe('La nueva contraseña debe tener al menos 6 caracteres');
    });

    test('rechaza nueva contraseña sin formato correcto', async () => {
      const body = {
        currentPassword: 'OldPass123',
        newPassword: 'password',
        confirmPassword: 'password'
      };
      
      const errors = await validateRequest(changePasswordValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const passwordError = errors.array().find(err => err.path === 'newPassword');
      expect(passwordError).toBeDefined();
    });

    test('rechaza cuando las contraseñas no coinciden', async () => {
      const body = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
        confirmPassword: 'Different123'
      };
      
      const errors = await validateRequest(changePasswordValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const confirmError = errors.array().find(err => err.path === 'confirmPassword');
      expect(confirmError).toBeDefined();
      expect(confirmError.msg).toBe('Las contraseñas no coinciden');
    });

    test('acepta cambio de contraseña válido', async () => {
      const body = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123'
      };
      
      const errors = await validateRequest(changePasswordValidation, body);
      
      expect(errors.isEmpty()).toBe(true);
    });
  });
});

describe('Validación de Username', () => {
  describe('registerValidation - Username', () => {
    test('rechaza username menor a 3 caracteres', async () => {
      const body = {
        username: 'ab',
        email: 'usuario@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const usernameError = errors.array().find(err => err.path === 'username');
      expect(usernameError).toBeDefined();
      expect(usernameError.msg).toBe('El username debe tener entre 3 y 50 caracteres');
    });

    test('rechaza username vacío', async () => {
      const body = {
        username: '',
        email: 'usuario@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      expect(errors.isEmpty()).toBe(false);
      const usernameError = errors.array().find(err => err.path === 'username');
      expect(usernameError).toBeDefined();
    });

    test('acepta username válido', async () => {
      const body = {
        username: 'usuario_valido',
        email: 'usuario@dominio.com',
        password: 'Password123'
      };
      
      const errors = await validateRequest(registerValidation, body);
      
      const usernameError = errors.array().find(err => err.path === 'username');
      expect(usernameError).toBeUndefined();
    });
  });
});
