const express = require('express');
const router = express.Router();
const emailTemplatesController = require('../controllers/emailTemplatesController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// Используем опциональную авторизацию - можно работать и без логина
router.use(optionalAuth);

// GET /api/email-templates - получить все шаблоны
router.get('/', emailTemplatesController.getTemplates);

// GET /api/email-templates/:id - получить шаблон по ID
router.get('/:id', emailTemplatesController.getTemplateById);

// POST /api/email-templates - создать новый шаблон
router.post('/', emailTemplatesController.createTemplate);

// PUT /api/email-templates/:id - обновить шаблон
router.put('/:id', emailTemplatesController.updateTemplate);

// DELETE /api/email-templates/:id - удалить шаблон (требует авторизацию + админ)
router.delete('/:id', authenticateToken, requireAdmin, emailTemplatesController.deleteTemplate);

// POST /api/email-templates/:id/duplicate - дублировать шаблон
router.post('/:id/duplicate', emailTemplatesController.duplicateTemplate);

module.exports = router;
