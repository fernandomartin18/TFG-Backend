import { Router } from 'express';
import * as plantUmlController from '../controllers/plantuml.controller.js';
import { optionalAuth, authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/plantuml-templates
router.get('/', optionalAuth, plantUmlController.getTemplates);

// POST /api/plantuml-templates
router.post('/', authenticate, plantUmlController.createTemplate);

// PUT /api/plantuml-templates/:id
router.put('/:id', authenticate, plantUmlController.updateTemplate);

// DELETE /api/plantuml-templates/:id
router.delete('/:id', authenticate, plantUmlController.deleteTemplate);

export default router;
