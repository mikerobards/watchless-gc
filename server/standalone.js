// Standalone server using only Node.js built-in modules
const http = require('http');
const url = require('url');
const path = require('path');

const port = process.env.PORT || 8080;

console.log('=== Starting Standalone Server ===');
console.log('Port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Simple HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: port,
      uptime: process.uptime()
    }));
    return;
  }
  
  // Status endpoint
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      server: 'WatchLess Standalone',
      port: port,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cwd: process.cwd(),
      dirname: __dirname
    }));
    return;
  }
  
  // Save session endpoint (POST)
  if (pathname === '/api/save-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Session data received:', data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Session received successfully (standalone server)',
          data: {
            ...data,
            timestamp: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('Error parsing session data:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Invalid JSON data',
          error: error.message
        }));
      }
    });
    return;
  }
  
  // Root endpoint
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WatchLess - Standalone Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 600px; margin: 0 auto; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🕐 WatchLess Server</h1>
          <p><strong>Status:</strong> Running (Standalone Mode)</p>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
          
          <h2>Available Endpoints:</h2>
          <div class="endpoint">
            <strong><a href="/health">GET /health</a></strong> - Health check
          </div>
          <div class="endpoint">
            <strong><a href="/api/status">GET /api/status</a></strong> - Server status
          </div>
          <div class="endpoint">
            <strong>POST /api/save-session</strong> - Save timer session data
          </div>
          
          <h2>Next Steps:</h2>
          <p>✅ Server is running successfully</p>
          <p>⏳ React app integration coming next</p>
          <p>⏳ Google Sheets integration coming next</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>Path: ${pathname}</p>
      <p><a href="/">← Back to Home</a></p>
    </body>
    </html>
  `);
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Standalone server listening on port ${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Status: http://localhost:${port}/api/status`);
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});