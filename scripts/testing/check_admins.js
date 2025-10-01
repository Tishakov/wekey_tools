const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('👨‍💼 Поиск администраторов в базе данных...\n');

db.all('SELECT id, email, username, role, status FROM users WHERE role = "admin"', (err, rows) => {
  if (err) {
    console.error('❌ Ошибка при поиске админов:', err.message);
    return;
  }

  if (rows.length === 0) {
    console.log('❌ Администраторы не найдены');
  } else {
    console.log(`✅ Найдено ${rows.length} администраторов:\n`);
    rows.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
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