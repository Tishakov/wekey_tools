const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Simple server works!' }));
});

server.listen(8081, '127.0.0.1', () => {
  console.log('Simple HTTP server running on http://127.0.0.1:8081');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});