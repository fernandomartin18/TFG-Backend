# Módulo de Base de Datos

Este directorio contiene todos los módulos y utilidades para interactuar con la base de datos PostgreSQL.

## Estructura

```
db/
├── index.js              # Exporta todos los módulos
├── users.js              # Operaciones de usuarios
├── chats.js              # Operaciones de chats
├── messages.js           # Operaciones de mensajes
├── message_images.js     # Operaciones de imágenes
└── generated_codes.js    # Operaciones de código generado
```

## Configuración

La configuración de la base de datos se encuentra en:
- `.env` - Variables de entorno
- `src/config/index.js` - Configuración exportada
- `src/config/database.js` - Pool de conexiones

### Variables de entorno necesarias:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tfg_app
DB_USER=postgres
DB_PASSWORD=tu_password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

## Uso

### Importar módulos

```javascript
import { users, chats, messages, messageImages, generatedCodes } from './db/index.js';
```

### Ejemplos

#### Crear un usuario
```javascript
const newUser = await users.createUser({
  username: 'johndoe',
  email: 'john@example.com',
  passwordHash: 'hashed_password',
  avatarUrl: 'https://example.com/avatar.jpg'
});
```

#### Obtener chats de un usuario
```javascript
const userChats = await chats.getChatsByUserId(userId);
```

#### Crear un mensaje
```javascript
const message = await messages.createMessage({
  chatId: 1,
  role: 'user',
  content: '¿Cómo crear un componente React?',
  modelsUsed: ['llama3.2-vision']
});
```

#### Transacciones

Para operaciones que requieren múltiples queries en una transacción:

```javascript
import { getClient } from '../config/database.js';

const client = await getClient();
try {
  await client.query('BEGIN');
  
  // Crear chat
  const chatResult = await client.query(
    'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id',
    [userId, 'Nuevo Chat']
  );
  
  // Crear mensaje
  await client.query(
    'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
    [chatResult.rows[0].id, 'user', 'Hola']
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Funciones disponibles

### Users (users.js)
- `getUserById(id)` - Obtener usuario por ID
- `getUserByUsername(username)` - Obtener usuario por username
- `getUserByEmail(email)` - Obtener usuario por email
- `createUser({ username, email, passwordHash, avatarUrl })` - Crear usuario
- `updateUser(id, updates)` - Actualizar usuario
- `updateUserPassword(id, passwordHash)` - Actualizar contraseña
- `deleteUser(id)` - Eliminar usuario
- `getUserPasswordHash(username)` - Obtener hash de contraseña

### Chats (chats.js)
- `getChatsByUserId(userId)` - Obtener chats de un usuario
- `getChatById(chatId)` - Obtener chat por ID
- `createChat(userId, title)` - Crear chat
- `updateChatTitle(chatId, title)` - Actualizar título
- `touchChat(chatId)` - Actualizar timestamp
- `deleteChat(chatId)` - Eliminar chat
- `verifyChatOwnership(chatId, userId)` - Verificar propiedad

### Messages (messages.js)
- `getMessagesByChatId(chatId)` - Obtener mensajes de un chat
- `getMessageById(messageId)` - Obtener mensaje por ID
- `createMessage({ chatId, role, content, modelsUsed })` - Crear mensaje
- `deleteMessage(messageId)` - Eliminar mensaje
- `deleteMessagesByChat(chatId)` - Eliminar todos los mensajes
- `getLastMessageByChatId(chatId)` - Obtener último mensaje
- `countMessagesByChatId(chatId)` - Contar mensajes

### Message Images (message_images.js)
- `getImagesByMessageId(messageId)` - Obtener imágenes
- `getImageById(imageId)` - Obtener imagen por ID
- `createImage({ messageId, originalFilename, storedFilename, filePath, mimeType, fileSize, imageOrder })` - Crear imagen
- `deleteImage(imageId)` - Eliminar imagen
- `deleteImagesByMessage(messageId)` - Eliminar todas las imágenes
- `countImagesByMessageId(messageId)` - Contar imágenes

### Generated Codes (generated_codes.js)
- `getCodesByMessageId(messageId)` - Obtener códigos generados
- `getCodeById(codeId)` - Obtener código por ID
- `createCode({ messageId, modelUsed, codeContent, language, filename, filePath, fileSize, isZip, codeOrder })` - Crear código
- `incrementDownloadCount(codeId)` - Incrementar descargas
- `deleteCode(codeId)` - Eliminar código
- `deleteCodesByMessage(messageId)` - Eliminar todos los códigos
- `getCodesByLanguage(language)` - Obtener códigos por lenguaje
- `getZipContents(generatedCodeId)` - Obtener contenido de ZIP
- `createZipContent({ generatedCodeId, filename, filePathInZip, language, content, fileSize })` - Crear contenido ZIP

## Health Check

El endpoint `/api/health` verifica:
- Conexión a PostgreSQL
- Conexión a FastAPI
- Estado general del sistema

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T10:30:00.000Z",
  "services": {
    "database": "ok",
    "fastapi": "ok"
  }
}
```
