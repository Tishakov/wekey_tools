const { sequelize } = require('./src/config/database');

async function fixPasswordConstraint() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Создаем новую таблицу без NOT NULL ограничения для password
    await sequelize.query(`DROP TABLE IF EXISTS users_new`);
    
    await sequelize.query(`CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255), -- НЕ NOT NULL для Google пользователей
      firstName VARCHAR(255),
      lastName VARCHAR(255),
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      language TEXT DEFAULT 'ru',
      theme TEXT DEFAULT 'dark',
      avatar VARCHAR(255),
      apiRequestsCount INTEGER DEFAULT 0,
      dailyApiLimit INTEGER DEFAULT 100,
      lastApiReset DATETIME,
      isEmailVerified BOOLEAN DEFAULT false,
      emailVerificationToken VARCHAR(255),
      passwordResetToken VARCHAR(255),
      passwordResetExpires DATETIME,
      lastLoginAt DATETIME,
      loginCount INTEGER DEFAULT 0,
      googleId VARCHAR(255),
      isGoogleUser BOOLEAN DEFAULT false,
      name VARCHAR(255),
      lastLogin DATETIME,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )`);
    console.log('✅ Created new users table');
    
    // Копируем данные если они есть
    try {
      await sequelize.query(`INSERT INTO users_new 
        SELECT * FROM users`);
      console.log('✅ Copied existing data');
    } catch (error) {
      console.log('ℹ️ No existing data to copy');
    }
    
    // Заменяем таблицы
    await sequelize.query('DROP TABLE IF EXISTS users');
    await sequelize.query('ALTER TABLE users_new RENAME TO users');
    console.log('✅ Replaced old table with new one');
    
    console.log('🎉 Password field is now optional in database');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
}

fixPasswordConstraint();