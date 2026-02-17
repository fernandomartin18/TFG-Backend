import express from 'express';
import * as projectsController from '../controllers/projects.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los proyectos del usuario
router.get('/', projectsController.getUserProjects);

// Crear un nuevo proyecto
router.post('/', projectsController.createProject);

// Actualizar nombre de un proyecto
router.put('/:projectId', projectsController.updateProjectName);

// Alternar estado expandido/colapsado
router.patch('/:projectId/toggle-expand', projectsController.toggleProjectExpanded);

// Eliminar un proyecto
router.delete('/:projectId', projectsController.deleteProject);

// Agregar un chat a un proyecto
router.post('/add-chat', projectsController.addChatToProject);

// Quitar un chat de un proyecto
router.delete('/remove-chat/:chatId', projectsController.removeChatFromProject);

export default router;
