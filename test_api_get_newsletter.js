const fetch = require('node-fetch');

async function testGetNewsletter() {
  try {
    console.log('🔍 Тестируем API endpoint GET /api/newsletters/6...\n');
    
    const response = await fetch('http://localhost:8880/api/newsletters/6', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Пока без авторизации для тестирования
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешный ответ:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Ошибка:');
      console.log(errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении запроса:', error.message);
  }
}

testGetNewsletter();