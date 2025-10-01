const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Временный тестовый endpoint без авторизации (ДО middleware)
router.get('/:id/raw-test', (req, res) => {
  try {
    const { id } = req.params;
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    
    console.log(`🔍 Raw test - получение рассылки ID: ${id}`);
    
    const dbPath = path.join(__dirname, '../../../database.sqlite');
    const db = new sqlite3.Database(dbPath);

    db.get('SELECT * FROM newsletters WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('❌ Ошибка SQL:', err.message);
        return res.status(500).json({ error: 'Ошибка базы данных', details: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      console.log('✅ Рассылка найдена:', row.title);
      res.json(row);
      
      db.close();
    });
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Все остальные маршруты требуют аутентификации и права администратора
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