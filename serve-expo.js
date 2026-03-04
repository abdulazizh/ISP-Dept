const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const NEXTJS_PORT = 3000;
const EXPO_APP_DIR = path.join(__dirname, 'public', 'app');

// Create a proxy for API requests
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${NEXTJS_PORT}`,
  changeOrigin: true
});

const server = http.createServer((req, res) => {
  const url = req.url;

  // API requests go to Next.js
  if (url.startsWith('/api/')) {
    proxy.web(req, res);
    return;
  }

  // For Expo assets
  if (url.startsWith('/_expo/') || url.startsWith('/assets/')) {
    const filePath = path.join(EXPO_APP_DIR, url);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Content-Length': stat.size
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // For favicon
  if (url === '/favicon.ico') {
    const filePath = path.join(EXPO_APP_DIR, 'favicon.ico');
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'image/x-icon',
        'Content-Length': stat.size
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // For all other routes, serve index.html (SPA routing)
  const indexPath = path.join(EXPO_APP_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const stat = fs.statSync(indexPath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': stat.size
    });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };
  return types[ext] || 'application/octet-stream';
}

server.listen(PORT, () => {
  console.log(`Combined server running at http://localhost:${PORT}`);
  console.log(`- Expo app served from: ${EXPO_APP_DIR}`);
  console.log(`- API proxied to: http://localhost:${NEXTJS_PORT}`);
});
