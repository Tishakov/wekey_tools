const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📋 Проверка структуры таблицы newsletters...\n');

// Получим структуру таблицы
db.all(`PRAGMA table_info(newsletters)`, (err, columns) => {
  if (err) {
    console.error('❌ Ошибка при получении структуры таблицы:', err.message);
    return;
  }

  console.log('📊 Структура таблицы newsletters:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n📝 Проверяем данные в таблице...\n');
  
  // Теперь получим данные, используя правильные имена колонок
  db.all(`SELECT * FROM newsletters ORDER BY rowid DESC LIMIT 10`, (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при выполнении запроса:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('📝 В таблице newsletters нет записей.');
    } else {
      console.log(`📊 Найдено ${rows.length} рассылок:\n`);
      
      rows.forEach((row, index) => {
        console.log(`${index + 1}. Запись:`, JSON.stringify(row, null, 2));
        console.log('');
      });
    }

    db.close((err) => {
      if (err) {
        console.error('❌ Ошибка при закрытии базы данных:', err);
      } else {
        console.log('✅ Соединение с базой данных закрыто.');
      }
    });
  });
});