import { body, param } from 'express-validator';

/**
 * Validaciones para registro de usuario
 */
export const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('El username es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('avatarUrl')
    .optional()
    .trim()
    .isURL().withMessage('La URL del avatar debe ser válida'),
];

/**
 * Validaciones para login
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
];

/**
 * Validaciones para actualizar usuario
 */
export const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('avatarUrl')
    .optional()
    .trim()
    .isURL().withMessage('La URL del avatar debe ser válida'),
];

/**
 * Validaciones para cambiar contraseña
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('confirmPassword')
    .notEmpty().withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];

/**
 * Validaciones para refresh token
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido'),
];

/**
 * Validación de parámetro ID
 */
export const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
];
