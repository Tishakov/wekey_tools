const http = require('http');

function makeRequest(url, callback) {
    http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            callback(null, data);
        });
    }).on('error', (err) => {
        callback(err, null);
    });
}

console.log('Проверяем счетчик для text-sorting...');
makeRequest('http://localhost:8880/api/stats/launch-count/text-sorting', (err, data) => {
    if (err) {
        console.error('Ошибка:', err.message);
        return;
    }
    
    try {
        const parsed = JSON.parse(data);
        console.log('Текущий счетчик:', parsed.count);
    } catch (parseErr) {
        console.log('Ответ сервера:', data);
    }
});