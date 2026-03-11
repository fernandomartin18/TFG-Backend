import { Router } from 'express';
import * as templatesController from '../controllers/templates.controller.js';

const router = Router();

// GET /api/templates (public)
router.get('/', templatesController.getTemplates);

export default router;
