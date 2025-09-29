const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Все маршруты требуют аутентификации и права администратора
router.use(authenticateToken);
router.use(requireAdmin);

// Получить все рассылки
router.get('/', newsletterController.getAllNewsletters);

// Создать новую рассылку
router.post('/', newsletterController.createNewsletter);

// Получить конкретную рассылку
router.get('/:id', newsletterController.getNewsletter);

// Обновить рассылку
router.put('/:id', newsletterController.updateNewsletter);

// Удалить рассылку
router.delete('/:id', newsletterController.deleteNewsletter);

// Получить аудиторию для рассылки (предварительный просмотр)
router.post('/audience/preview', newsletterController.getNewsletterAudience);

// Отправить рассылку
router.post('/:id/send', newsletterController.sendNewsletter);

// Получить статистику рассылки
router.get('/:id/stats', newsletterController.getNewsletterStats);

module.exports = router;