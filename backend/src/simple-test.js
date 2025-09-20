const http = require('http');

console.log('🧪 Простой тест admin endpoints...\n');

function testLogin() {
  const postData = JSON.stringify({
    email: 'admin@wekey.tools',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('🔐 Login response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
      
      if (res.statusCode === 200) {
        const data = JSON.parse(body);
        testResetWithToken(data.token);
      } else {
        console.log('❌ Login failed');
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Login request error:', err.message);
  });

  req.write(postData);
  req.end();
}

function testResetWithToken(token) {
  console.log('\n🔄 Testing reset with token:', token);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/reset-stats',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n🔄 Reset response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Reset request error:', err.message);
  });

  req.end();
}

// Start test
testLogin();