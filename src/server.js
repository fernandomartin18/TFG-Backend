import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { testConnection, closePool } from './config/database.js';
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handler para errores de parsing de body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('Error de parsing JSON:', err.message);
    return res.status(400).json({ 
      error: 'Invalid JSON', 
      message: err.message 
    });
  }
  if (err.type === 'entity.too.large') {
    logger.error('Body demasiado grande:', err.message);
    return res.status(413).json({ 
      error: 'Request too large', 
      message: 'El tamaño de la petición excede el límite permitido' 
    });
  }
  next(err);
});

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

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    logger.info('Probando conexión a PostgreSQL...');
    await testConnection();

    // Iniciar el servidor Express
    app.listen(PORT, HOST, () => {
      logger.info('='.repeat(50));
      logger.info(`Servidor funcionando en: http://${HOST}:${PORT}`);
      logger.info(`Entorno: ${config.server.env}`);
      logger.info(`URL de FastAPI: ${config.fastapi.url}`);
      logger.info(`Timeout: ${config.fastapi.timeout / 1000}s`);
      logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);
      logger.info(`Base de datos: ${config.database.database}@${config.database.host}:${config.database.port}`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  closePool().then(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  closePool().then(() => process.exit(1));
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  logger.info('\nCerrando servidor...');
  await closePool();
  logger.info('Pool de conexiones cerrado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\nCerrando servidor...');
  await closePool();
  logger.info('Pool de conexiones cerrado');
  process.exit(0);
});

export default app;
