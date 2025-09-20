const http = require('http');

console.log('🔍 Тестируем сервер...');

// Простой GET запрос
const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`✅ Статус: ${res.statusCode}`);
    console.log('📋 Заголовки:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('✅ Ответ:', data);
        console.log('🎉 Тест успешно завершен!');
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.log('❌ Ошибка:', err.message);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Таймаут');
    req.destroy();
    process.exit(1);
});

req.end();