const fetch = require('node-fetch');

async function testAdminAPI() {
  try {
    console.log('🔍 Тестирование API admin-login...');
    
    const response = await fetch('http://localhost:8880/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@wekey.tools',
        password: 'admin123'
      })
    });
    
    console.log('📡 Статус ответа:', response.status, response.statusText);
    
    const data = await response.text();
    console.log('📋 Ответ сервера:', data);
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      if (jsonData.token) {
        console.log('✅ Токен получен! Длина:', jsonData.token.length);
        console.log('🔑 Первые 20 символов токена:', jsonData.token.substring(0, 20) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
  }
}

testAdminAPI();