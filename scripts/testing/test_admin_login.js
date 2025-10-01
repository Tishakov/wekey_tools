const https = require('https');
const querystring = require('querystring');

const loginData = {
  email: 'admin@wekey.tools',
  password: 'admin123' // Попробуем стандартный пароль
};

const postData = JSON.stringify(loginData);

const options = {
  hostname: 'localhost',
  port: 8880,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔐 Попытка входа администратора...\n');
console.log('📧 Email:', loginData.email);
console.log('🔑 Password: [HIDDEN]\n');

const req = require('http').request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.token) {
        console.log('\n✅ Токен получен!');
        console.log('🎫 Token:', jsonData.token);
        
        // Сохраним токен в файл для дальнейшего использования
        require('fs').writeFileSync('admin_token.txt', jsonData.token);
        console.log('💾 Токен сохранен в admin_token.txt');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end();