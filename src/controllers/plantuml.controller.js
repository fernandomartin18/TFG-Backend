import * as plantUmlService from '../db/plantuml.js';

export const getTemplates = async (req, res, next) => {
    try {
        const userId = req.user?.userId || null;
        const templates = await plantUmlService.findAll(userId);
        res.json({ success: true, count: templates.length, templates });
    } catch (error) {
        next(error);
    }
};

export const createTemplate = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { title, code } = req.body;
        
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'El código PlantUML es obligatorio' });
        }
        
        const template = await plantUmlService.create(title.trim(), code.trim(), userId);
        res.status(201).json({ success: true, template });
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const templateId = req.params.id;
        const { title, code } = req.body;
        
        if (!title || !title.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
        if (!code || !code.trim()) return res.status(400).json({ error: 'El código es obligatorio' });

        const updated = await plantUmlService.update(templateId, title.trim(), code.trim(), userId);
        if (!updated) return res.status(404).json({ error: 'Plantilla no encontrada o sin permisos' });
        
        res.json({ success: true, template: updated });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const templateId = req.params.id;
        
        const deleted = await plantUmlService.remove(templateId, userId);
        if (!deleted) return res.status(404).json({ error: 'Plantilla no encontrada o sin permisos' });
        
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
