import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const app = express();

// Configurar nivel de logging
logger.setLevel(config.logging.level);

// Middlewares
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan para logging de requests
if (config.server.env === 'development') {
  app.use(morgan('dev'));
}

// Rutas principales
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'TFG Backend API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      models: '/api/models',
      generate: '/api/generate',
      docs: '/api/docs (próximamente)',
    },
  });
});

// Manejadores de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info('='.repeat(50));
  logger.info(`Servidor funcionando en: http://${HOST}:${PORT}`);
  logger.info(`Entorno: ${config.server.env}`);
  logger.info(`URL de FastAPI: ${config.fastapi.url}`);
  logger.info(`Timeout: ${config.fastapi.timeout / 1000}s`);
  logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);
  logger.info('='.repeat(50));
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
