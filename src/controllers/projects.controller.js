import * as projectsDb from '../db/projects.js';
import * as chatsDb from '../db/chats.js';

/**
 * Obtener todos los proyectos del usuario autenticado
 */
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projects = await projectsDb.getUserProjects(userId);
    
    // Obtener chats de cada proyecto
    const projectsWithChats = await Promise.all(
      projects.map(async (project) => {
        const chats = await projectsDb.getProjectChats(project.id);
        return {
          ...project,
          chats
        };
      })
    );
    
    res.json(projectsWithChats);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

/**
 * Crear un nuevo proyecto
 */
export const createProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
    }

    const project = await projectsDb.createProject(userId, name.trim());
    res.status(201).json(project);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

/**
 * Actualizar nombre de un proyecto
 */
export const updateProjectName = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
    }

    // Verificar propiedad
    const isOwner = await projectsDb.verifyProjectOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'No tienes permiso para editar este proyecto' });
    }

    const project = await projectsDb.updateProjectName(projectId, name.trim());
    res.json(project);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

/**
 * Alternar estado expandido/colapsado
 */
export const toggleProjectExpanded = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;
    const { isExpanded } = req.body;

    // Verificar propiedad
    const isOwner = await projectsDb.verifyProjectOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este proyecto' });
    }

    const project = await projectsDb.toggleProjectExpanded(projectId, isExpanded);
    res.json(project);
  } catch (error) {
    console.error('Error al cambiar estado del proyecto:', error);
    res.status(500).json({ error: 'Error al cambiar estado del proyecto' });
  }
};

/**
 * Eliminar un proyecto
 */
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    // Verificar propiedad
    const isOwner = await projectsDb.verifyProjectOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este proyecto' });
    }

    await projectsDb.deleteProject(projectId);
    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

/**
 * Agregar un chat a un proyecto
 */
export const addChatToProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId, projectId } = req.body;

    // Verificar que el chat pertenece al usuario
    const chatOwner = await chatsDb.verifyChatOwnership(chatId, userId);
    if (!chatOwner) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este chat' });
    }

    // Verificar que el proyecto pertenece al usuario
    const projectOwner = await projectsDb.verifyProjectOwnership(projectId, userId);
    if (!projectOwner) {
      return res.status(403).json({ error: 'No tienes permiso para usar este proyecto' });
    }

    const chat = await chatsDb.addChatToProject(chatId, projectId);
    res.json(chat);
  } catch (error) {
    console.error('Error al agregar chat al proyecto:', error);
    res.status(500).json({ error: 'Error al agregar chat al proyecto' });
  }
};

/**
 * Quitar un chat de un proyecto
 */
export const removeChatFromProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;

    // Verificar que el chat pertenece al usuario
    const chatOwner = await chatsDb.verifyChatOwnership(chatId, userId);
    if (!chatOwner) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este chat' });
    }

    const chat = await chatsDb.removeChatFromProject(chatId);
    res.json(chat);
  } catch (error) {
    console.error('Error al quitar chat del proyecto:', error);
    res.status(500).json({ error: 'Error al quitar chat del proyecto' });
  }
};
