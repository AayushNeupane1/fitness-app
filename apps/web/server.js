const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.WEB_PORT || 3000);
const publicDir = path.join(__dirname, 'public');

function serveFile(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = http.createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(publicDir, requestPath);

  if (requestPath.endsWith('.js')) {
    serveFile(res, filePath, 'application/javascript; charset=utf-8');
    return;
  }

  if (requestPath.endsWith('.css')) {
    serveFile(res, filePath, 'text/css; charset=utf-8');
    return;
  }

  if (requestPath.endsWith('.html')) {
    serveFile(res, filePath, 'text/html; charset=utf-8');
    return;
  }

  serveFile(res, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
});

server.listen(PORT, () => {
  console.log(`Web app listening on http://localhost:${PORT}`);
});
