# 🔐 Sistema de Autenticación JWT

Sistema completo de autenticación y gestión de usuarios con JSON Web Tokens (JWT).

## 📋 Características

- ✅ Registro de usuarios con validación completa
- ✅ Login con generación de tokens JWT
- ✅ Access Token (15 minutos) y Refresh Token (7 días)
- ✅ Protección de rutas con middleware de autenticación
- ✅ Actualización de datos de usuario (username, email, avatar)
- ✅ Cambio de contraseña seguro (requiere contraseña actual)
- ✅ Validaciones robustas con express-validator
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Gestión de errores completa

## 🏗️ Arquitectura

```
src/
├── config/
│   └── index.js                    # Configuración JWT
├── controllers/
│   ├── auth.controller.js          # Login, registro, refresh, logout
│   └── users.controller.js         # CRUD de usuarios
├── middlewares/
│   ├── auth.middleware.js          # Verificación JWT
│   ├── validation.middleware.js    # Manejo de errores de validación
│   └── validators.js               # Reglas de validación
├── routes/
│   ├── auth.routes.js              # Rutas de autenticación
│   └── users.routes.js             # Rutas de usuarios
├── services/
│   └── auth.service.js             # Lógica JWT y bcrypt
└── db/
    └── users.js                     # Queries de usuarios
```

## 🔑 Variables de Entorno

Añade estas variables a tu archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 📡 Endpoints

### Autenticación

#### 1. Registro de Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "avatarUrl": "https://example.com/avatar.jpg"  // Opcional
}
```

**Respuesta (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-22T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validaciones:**
- Username: 3-50 caracteres, solo letras, números, guiones y guiones bajos
- Email: Formato válido
- Password: Mínimo 6 caracteres, debe contener mayúscula, minúscula y número
- Username y email únicos

---

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "Password123"
}
```

**Respuesta (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-22T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 3. Renovar Tokens
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta (200):**
```json
{
  "message": "Tokens renovados exitosamente",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 4. Obtener Perfil 🔒
```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Respuesta (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-22T12:00:00.000Z",
    "updatedAt": "2026-01-22T12:00:00.000Z"
  }
}
```

---

#### 5. Logout 🔒
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Respuesta (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### Gestión de Usuarios

#### 6. Actualizar Datos 🔒
```http
PUT /api/users/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "username": "newusername",        // Opcional
  "email": "newemail@example.com",  // Opcional
  "avatarUrl": "https://..."        // Opcional
}
```

**Respuesta (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "avatarUrl": "https://...",
    "createdAt": "2026-01-22T12:00:00.000Z",
    "updatedAt": "2026-01-22T13:00:00.000Z"
  }
}
```

---

#### 7. Cambiar Contraseña 🔒
```http
PUT /api/users/me/password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Respuesta (200):**
```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

**Validaciones:**
- Contraseña actual correcta
- Nueva contraseña diferente a la actual
- Nueva contraseña cumple requisitos de seguridad
- Confirmación coincide con nueva contraseña

---

#### 8. Eliminar Cuenta 🔒
```http
DELETE /api/users/me
Authorization: Bearer <accessToken>
```

**Respuesta (200):**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

---

#### 9. Obtener Usuario por ID
```http
GET /api/users/:id
```

---

#### 10. Obtener Usuario por Username
```http
GET /api/users/username/:username
```

---

## 🔒 Autenticación

Todas las rutas marcadas con 🔒 requieren autenticación. Incluye el token en el header:

```
Authorization: Bearer <tu_access_token>
```

### Flujo de Autenticación

1. **Login/Registro** → Recibe `accessToken` y `refreshToken`
2. **Usar accessToken** en cada request (válido 15 minutos)
3. **Cuando expire** → Usar `refreshToken` en `/api/auth/refresh`
4. **Recibir nuevos tokens** → Continuar usando el servicio

## 🛡️ Códigos de Error

| Código | Significado |
|--------|-------------|
| 400 | Validación fallida o datos incorrectos |
| 401 | No autenticado o token inválido/expirado |
| 404 | Recurso no encontrado |
| 409 | Conflicto (username/email ya existe) |
| 500 | Error del servidor |

### Errores de Token

```json
{
  "error": "Token expirado",
  "message": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente"
}
```

```json
{
  "error": "Token inválido",
  "message": "El token proporcionado no es válido"
}
```

## 🧪 Testing

### Script de Pruebas Automatizado

```bash
./test-auth.sh
```

Este script prueba:
1. Registro de usuario
2. Login
3. Obtener perfil
4. Actualizar datos
5. Cambiar contraseña
6. Login con nueva contraseña
7. Refresh token
8. Obtener usuario por ID
9. Logout
10. Acceso sin token (debe fallar)
11. Eliminar usuario

### Pruebas Manuales con cURL

#### Registro:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

#### Obtener perfil:
```bash
TOKEN="tu_access_token_aqui"
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 💡 Ejemplos de Uso

### JavaScript/Fetch

```javascript
// Registro
const register = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password123',
    }),
  });
  const data = await response.json();
  
  // Guardar tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};

// Request con autenticación
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.status === 401) {
    // Token expirado, renovar
    await refreshTokens();
    return getProfile(); // Reintentar
  }
  
  return response.json();
};

// Renovar tokens
const refreshTokens = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await response.json();
  
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};

// Actualizar perfil
const updateProfile = async (updates) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  return response.json();
};

// Cambiar contraseña
const changePassword = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/users/me/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  
  return response.json();
};
```

## 🔐 Seguridad

### Implementada:
- ✅ Contraseñas hasheadas con bcrypt (10 salt rounds)
- ✅ JWT firmado con secretos seguros
- ✅ Tokens con expiración
- ✅ Refresh tokens para renovación segura
- ✅ Validación estricta de inputs
- ✅ Protección contra duplicados
- ✅ Sanitización de datos
- ✅ No se exponen contraseñas en respuestas

### Recomendaciones adicionales:
- 🔸 Cambiar JWT_SECRET en producción (usar variables de entorno)
- 🔸 Implementar rate limiting
- 🔸 Implementar blacklist de tokens (logout real)
- 🔸 Añadir verificación de email
- 🔸 Implementar recuperación de contraseña
- 🔸 Añadir 2FA (autenticación de dos factores)
- 🔸 Logging de intentos de login fallidos
- 🔸 HTTPS en producción

## 📝 Notas

- Los **Access Tokens** expiran en 15 minutos
- Los **Refresh Tokens** expiran en 7 días
- El middleware `authenticate` verifica el token automáticamente
- Los tokens contienen: `userId`, `username`, `email`
- La contraseña actual es requerida para cambiar la contraseña
- Los usuarios eliminados pierden todos sus datos relacionados (CASCADE)

## 🚀 Próximas Funcionalidades

- [ ] Verificación de email
- [ ] Recuperación de contraseña por email
- [ ] Autenticación de dos factores (2FA)
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Blacklist de tokens
- [ ] Historial de sesiones
- [ ] Roles y permisos
- [ ] Rate limiting por usuario
