const http = require('http');

console.log('🧪 Testing stats endpoint with fixed server...');

const requestData = JSON.stringify({
  toolName: 'test-tool-fixed'
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
    if (res.statusCode === 200) {
      console.log('🎉 Stats endpoint works!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.on('timeout', () => {
  console.log('⏱️ Request timeout (server may still be working)');
  req.destroy();
});

req.write(requestData);
req.end();

console.log('📤 POST request sent to /api/stats/increment');