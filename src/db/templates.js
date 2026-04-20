import db from '../config/database.js';

export const getAllForUser = async (userId) => {
  const result = await db.query(
    'SELECT * FROM templates WHERE user_id IS NULL OR user_id = $1 ORDER BY user_id NULLS FIRST, id ASC',
    [userId]
  );
  return result.rows;
};

export const getPublicTemplates = async () => {
  const result = await db.query(
    'SELECT * FROM templates WHERE user_id IS NULL ORDER BY id ASC'
  );
  return result.rows;
};

export const create = async (userId, title, prompt) => {
  const result = await db.query(
    'INSERT INTO templates (user_id, title, prompt) VALUES ($1, $2, $3) RETURNING *',
    [userId, title, prompt]
  );
  return result.rows[0];
};

export const update = async (id, userId, title, prompt) => {
  const result = await db.query(
    'UPDATE templates SET title = $1, prompt = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [title, prompt, id, userId]
  );
  return result.rows[0];
};

export const remove = async (id, userId) => {
  const result = await db.query(
    'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0];
};
