const http = require('http');

console.log('🧪 Testing stats endpoint according to requirements...');

// Тестовые данные согласно ТЗ
const requestData = JSON.stringify({
  "toolName": "test",
  "inputLength": 5,
  "outputLength": 10
});

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/stats/increment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData)
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Response received!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const response = JSON.parse(data);
      if (response.success === true && response.data) {
        console.log('🎉 SUCCESS: Stats endpoint works as expected!');
        console.log('✅ Returned: { success: true, data: {...} }');
      } else {
        console.log('❌ FAIL: Response format incorrect');
      }
    } catch (e) {
      console.log('❌ FAIL: Response is not valid JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.on('timeout', () => {
  console.log('⏱️ Request timeout');
  req.destroy();
});

req.write(requestData);
req.end();

console.log('📤 POST request sent to /api/stats/increment');
console.log('📋 Test data:', requestData);