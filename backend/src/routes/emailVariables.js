const express = require('express');
const router = express.Router();
const emailVariablesController = require('../controllers/emailVariablesController');
const { requireAdmin } = require('../middleware/auth');

// Все роуты требуют авторизации администратора
router.use(requireAdmin);

// GET /api/email-variables - получить все переменные
router.get('/', emailVariablesController.getAllVariables);

// GET /api/email-variables/:id - получить одну переменную
router.get('/:id', emailVariablesController.getVariable);

// POST /api/email-variables - создать новую переменную (custom)
router.post('/', emailVariablesController.createVariable);

// PUT /api/email-variables/:id - обновить переменную
router.put('/:id', emailVariablesController.updateVariable);

// DELETE /api/email-variables/:id - удалить переменную (только custom)
router.delete('/:id', emailVariablesController.deleteVariable);

module.exports = router;
