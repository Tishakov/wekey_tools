const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Простой тест без Sequelize и авторизации
router.get('/test/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dbPath = path.join(__dirname, '../../database.sqlite');
    const db = new sqlite3.Database(dbPath);

    console.log(`🔍 Тестируем получение рассылки ID: ${id}`);
    
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

module.exports = router;