import * as templatesDb from '../db/templates.js';
import { logger } from '../utils/logger.js';

export const getTemplates = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.userId : null;
    let templates;
    if (userId) {
      templates = await templatesDb.getAllForUser(userId);
    } else {
      templates = await templatesDb.getPublicTemplates();
    }
    res.json(templates);
  } catch (error) {
    logger.error('Error al obtener plantillas:', error);
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const userId = req.user.userId; // required auth
    const { title, prompt } = req.body;
    
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Título y prompt son obligatorios' });
    }

    const newTemplate = await templatesDb.create(userId, title, prompt);
    res.status(201).json(newTemplate);
  } catch (error) {
    logger.error('Error al crear plantilla:', error);
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, prompt } = req.body;
    
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Título y prompt son obligatorios' });
    }

    const updated = await templatesDb.update(id, userId, title, prompt);
    if (!updated) {
      return res.status(404).json({ error: 'Plantilla no encontrada o no autorizada' });
    }
    res.json(updated);
  } catch (error) {
    logger.error('Error al actualizar plantilla:', error);
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const deleted = await templatesDb.remove(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Plantilla no encontrada o no autorizada' });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error al eliminar plantilla:', error);
    next(error);
  }
};
