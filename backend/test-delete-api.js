const fetch = require('node-fetch');

async function testDeleteAPI() {
  try {
    console.log('🧪 Тестирование API удаления пользователя...');
    
    // Сначала получаем токен админа
    const loginResponse = await fetch('http://localhost:8880/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@wekey.tools',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.token) {
      throw new Error('Не удалось получить токен админа');
    }
    
    console.log('✅ Токен админа получен');
    
    // Тестируем удаление тестового пользователя (ID: 7)
    const deleteResponse = await fetch('http://localhost:8880/api/admin/users/7', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Статус ответа:', deleteResponse.status, deleteResponse.statusText);
    
    const deleteData = await deleteResponse.text();
    console.log('📋 Ответ сервера:', deleteData);
    
    if (deleteResponse.ok) {
      const jsonData = JSON.parse(deleteData);
      console.log('✅ Пользователь успешно удален:', jsonData.data.deletedUser.email);
    } else {
      console.log('❌ Ошибка при удалении');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
  }
}

testDeleteAPI();