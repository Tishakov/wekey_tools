const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📋 Проверка структуры базы данных...\n');

// Проверим, существует ли таблица newsletters
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='newsletters'`, (err, row) => {
  if (err) {
    console.error('❌ Ошибка при проверке таблицы:', err.message);
    return;
  }

  if (!row) {
    console.log('❌ Таблица newsletters не существует в базе данных!');
    
    // Покажем список всех таблиц
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
      if (err) {
        console.error('❌ Ошибка при получении списка таблиц:', err.message);
        return;
      }
      
      console.log('📊 Существующие таблицы:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
      
      db.close();
    });
    
    return;
  }

  console.log('✅ Таблица newsletters существует');
  
  // Если таблица существует, проверим данные
  db.all(`SELECT id, title, status, created_at, updated_at FROM newsletters ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при выполнении запроса:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('📝 В таблице newsletters нет записей.');
    } else {
      console.log(`📊 Найдено ${rows.length} рассылок:\n`);
      
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Название: ${row.title}`);
        console.log(`   Статус: ${row.status}`);
        console.log(`   Создано: ${row.created_at}`);
        console.log(`   Обновлено: ${row.updated_at}`);
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