import * as templatesDb from '../db/templates.js';
import { logger } from '../utils/logger.js';

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await templatesDb.getAll();
    res.json(templates);
  } catch (error) {
    logger.error('Error al obtener plantillas:', error);
    next(error);
  }
};
