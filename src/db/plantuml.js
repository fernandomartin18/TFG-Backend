import { query as executeQuery } from '../config/database.js';

export const create = async (title, code, userId) => {
    const queryArgs = `
        INSERT INTO plantuml_templates (title, code, user_id)
        VALUES ($1, $2, $3)
        RETURNING 
            id, 
            title, 
            code, 
            user_id as "userId", 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `;
    const { rows } = await executeQuery(queryArgs, [title, code, userId]);
    return rows[0];
};

export const update = async (id, title, code, userId) => {
    const queryArgs = `
        UPDATE plantuml_templates 
        SET title = $1, code = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND user_id = $4
        RETURNING 
            id, 
            title, 
            code, 
            user_id as "userId", 
            created_at as "createdAt", 
            updated_at as "updatedAt"
    `;
    const { rows } = await executeQuery(queryArgs, [title, code, id, userId]);
    return rows[0];
};

export const remove = async (id, userId) => {
    const queryArgs = `
        DELETE FROM plantuml_templates
        WHERE id = $1 AND user_id = $2
        RETURNING id
    `;
    const { rows } = await executeQuery(queryArgs, [id, userId]);
    return rows[0];
};

/**
 * Recovers all plantuml templates (common + requesting user)
 * @param {number|null} userId 
 */
export const findAll = async (userId) => {
    let queryArgs = `
        SELECT 
            t.id, 
            t.title,
            t.code,
            t.user_id,
            t.created_at,
            t.updated_at
        FROM plantuml_templates t
        WHERE t.user_id IS NULL`;
        
    const values = [];

    if (userId) {
        queryArgs += ` OR t.user_id = $1`;
        values.push(userId);
    }
    
    queryArgs += ` ORDER BY t.created_at DESC`;

    const { rows } = await executeQuery(queryArgs, !!values.length ? values : undefined);
    
    // Add format properties similar to standard prompt templates
    return rows.map(r => ({
        ...r,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        userId: r.user_id
    }));
};
