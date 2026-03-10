import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // FastAPI Backend
  fastapi: {
    url: process.env.FASTAPI_URL || 'http://localhost:8001',
    timeout: Number.parseInt(process.env.REQUEST_TIMEOUT) || 600000,
  },

  // Server
  server: {
    port: Number.parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // CORS
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // Upload
  upload: {
    maxSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'tfg_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: Number.parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: Number.parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

