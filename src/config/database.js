import pg from 'pg';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Crear pool de conexiones
const pool = new Pool(config.database);

// Manejo de errores del pool
pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de PostgreSQL:', err);
});

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Conexión a PostgreSQL establecida correctamente');
    logger.info(`Timestamp del servidor: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

// Función helper para ejecutar queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query ejecutada', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Error en query:', { text, error: error.message });
    throw error;
  }
};

// Función para obtener un cliente del pool (para transacciones)
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Timeout para evitar que el cliente quede bloqueado
  const timeout = setTimeout(() => {
    logger.error('Cliente de base de datos no liberado después de 5 segundos');
  }, 5000);

  // Modificar release para limpiar el timeout
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };

  return client;
};

// Función para cerrar el pool (útil para tests o shutdown)
export const closePool = async () => {
  await pool.end();
  logger.info('Pool de PostgreSQL cerrado');
};

export default {
  query,
  getClient,
  testConnection,
  closePool,
  pool,
};
