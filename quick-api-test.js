// Быстрый тест API без токена авторизации
async function testPublicAPI() {
  console.log('🧪 Тестирование публичных эндпоинтов...\n');

  try {
    // Тест Health Check
    console.log('🔍 Проверка health check...');
    const healthResponse = await fetch('http://localhost:8880/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend работает:', healthData.status);
    }

    // Тест публичных новостей
    console.log('\n📰 Получение публичных новостей...');
    const newsResponse = await fetch('http://localhost:8880/api/news/public');
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      console.log(`✅ Найдено публичных новостей: ${newsData.news?.length || 0}`);
      
      if (newsData.news?.length > 0) {
        console.log(`📄 Первая новость: "${newsData.news[0].title}"`);
      }
    } else {
      console.log('⚠️ Публичные новости:', newsResponse.status, newsResponse.statusText);
    }

    // Тест получения рассылок (должен вернуть 401 без токена)
    console.log('\n📧 Проверка защищенного эндпоинта рассылок...');
    const newslettersResponse = await fetch('http://localhost:8880/api/newsletters');
    
    if (newslettersResponse.status === 401) {
      console.log('✅ Эндпоинт рассылок защищен (требует авторизацию)');
    } else {
      console.log('⚠️ Неожиданный статус для защищенного эндпоинта:', newslettersResponse.status);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск теста
testPublicAPI();