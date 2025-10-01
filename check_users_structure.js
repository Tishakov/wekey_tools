const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📋 Проверка структуры таблицы users...\n');

// Получим структуру таблицы
db.all('PRAGMA table_info(users)', (err, columns) => {
  if (err) {
    console.error('❌ Ошибка при получении структуры таблицы:', err.message);
    return;
  }

  console.log('📊 Структура таблицы users:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n👨‍💼 Проверяем администраторов...\n');
  
  // Найдем правильные названия колонок и получим админов
  db.all('SELECT * FROM users WHERE role = "admin" LIMIT 5', (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при поиске админов:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('❌ Администраторы не найдены');
    } else {
      console.log(`✅ Найдено ${rows.length} администраторов:\n`);
      rows.forEach((admin, index) => {
        console.log(`${index + 1}. Администратор:`, JSON.stringify(admin, null, 2));
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