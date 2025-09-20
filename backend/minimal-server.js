const express = require('express');
const app = express();
const PORT = 8080;

console.log('🚀 Starting minimal server...');

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', time: new Date().toISOString() });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Minimal server running on http://127.0.0.1:${PORT}`);
  console.log(`📍 Test: http://127.0.0.1:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Предотвращаем завершение
setInterval(() => {
  console.log('🔄 Server heartbeat');
}, 5000);

console.log('🔧 Setup completed');