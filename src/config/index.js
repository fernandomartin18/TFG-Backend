import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // FastAPI Backend
  fastapi: {
    url: process.env.FASTAPI_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 600000,
  },

  // Server
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // CORS
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
