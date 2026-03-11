import { query } from '../config/database.js';

/**
 * Obtener todos los proyectos de un usuario
 */
export const getUserProjects = async (userId) => {
  const result = await query(
    `SELECT 
      p.*,
      COUNT(c.id) as chat_count
    FROM projects p
    LEFT JOIN chats c ON p.id = c.project_id
    WHERE p.user_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Crear un nuevo proyecto
 */
export const createProject = async (userId, name) => {
  const result = await query(
    `INSERT INTO projects (user_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, name]
  );
  return result.rows[0];
};

/**
 * Actualizar nombre del proyecto
 */
export const updateProjectName = async (projectId, name) => {
  const result = await query(
    `UPDATE projects
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, projectId]
  );
  return result.rows[0];
};

/**
 * Alternar estado expandido/colapsado del proyecto
 */
export const toggleProjectExpanded = async (projectId, isExpanded) => {
  const result = await query(
    `UPDATE projects
     SET is_expanded = $1
     WHERE id = $2
     RETURNING *`,
    [isExpanded, projectId]
  );
  return result.rows[0];
};

/**
 * Eliminar proyecto (los chats quedan sin proyecto)
 */
export const deleteProject = async (projectId) => {
  await query('DELETE FROM projects WHERE id = $1', [projectId]);
};

/**
 * Obtener chats de un proyecto
 */
export const getProjectChats = async (projectId) => {
  const result = await query(
    `SELECT *
     FROM chats
     WHERE project_id = $1
     ORDER BY updated_at DESC`,
    [projectId]
  );
  return result.rows;
};

/**
 * Verificar si un project pertenece a un usuario
 */
export const verifyProjectOwnership = async (projectId, userId) => {
  const result = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
};

