const http = require('http');

// Тест health endpoint
function testHealth() {
    console.log('🔍 Тестируем health endpoint...');
    
    const options = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/health',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ Health endpoint работает');
            console.log('Статус:', res.statusCode);
            console.log('Ответ:', data);
            
            // Тестируем POST /api/stats/increment
            testStatsIncrement();
        });
    });

    req.on('error', (err) => {
        console.log('❌ Health endpoint не работает:', err.message);
    });

    req.end();
}

// Тест POST /api/stats/increment
function testStatsIncrement() {
    console.log('\n🔍 Тестируем POST /api/stats/increment...');
    
    const postData = JSON.stringify({
        toolName: 'password-generator',
        inputLength: 10,
        outputLength: 12,
        processingTime: 5
    });

    const options = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/stats/increment',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ POST /api/stats/increment работает');
            console.log('Статус:', res.statusCode);
            console.log('Ответ:', data);
        });
    });

    req.on('error', (err) => {
        console.log('❌ POST /api/stats/increment не работает:', err.message);
    });

    req.write(postData);
    req.end();
}

// Запускаем тесты
testHealth();