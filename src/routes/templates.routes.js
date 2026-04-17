import { Router } from 'express';
import * as templatesController from '../controllers/templates.controller.js';
import { optionalAuth, authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/templates (public or authenticated)
router.get('/', optionalAuth, templatesController.getTemplates);

// POST /api/templates (authenticated)
router.post('/', authenticate, templatesController.createTemplate);

// PUT /api/templates/:id (authenticated)
router.put('/:id', authenticate, templatesController.updateTemplate);

// DELETE /api/templates/:id (authenticated)
router.delete('/:id', authenticate, templatesController.deleteTemplate);

export default router;
