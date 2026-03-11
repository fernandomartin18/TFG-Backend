import db from '../config/database.js';

export const getAll = async () => {
  const result = await db.query('SELECT * FROM templates ORDER BY id ASC');
  return result.rows;
};
