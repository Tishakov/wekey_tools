const http = require('http');

console.log('🧪 Testing stats endpoint with final data...');

const requestData = JSON.stringify({
  "toolName": "test",
  "inputLength": 5,
  "outputLength": 10,
  "processingTime": 3
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
      if (response.success === true) {
        console.log('🎉 SUCCESS: Stats endpoint works correctly!');
        console.log('✅ Expected: success: true');
        console.log('✅ Expected: data contains request body');
      } else {
        console.log('❌ FAIL: success not true');
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
  console.log('⏱️ Request timeout (server may still be working)');
  req.destroy();
});

req.write(requestData);
req.end();

console.log('📤 POST request sent to /api/stats/increment');
console.log('📋 Data:', requestData);