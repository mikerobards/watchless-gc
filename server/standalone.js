// Standalone server using only Node.js built-in modules
const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 8080;

console.log('=== Starting Standalone Server with React Support ===');
console.log('Port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Check for React build files
const publicPath = path.join(__dirname, 'public');
console.log('Checking for React files at:', publicPath);

let hasReactApp = false;
let reactFiles = [];

try {
  if (fs.existsSync(publicPath)) {
    reactFiles = fs.readdirSync(publicPath);
    hasReactApp = reactFiles.includes('index.html');
    console.log('✅ Public directory found with files:', reactFiles.slice(0, 10));
    console.log('✅ React app available:', hasReactApp);
  } else {
    console.log('❌ No public directory found');
  }
} catch (error) {
  console.log('Error checking React files:', error.message);
}

// MIME type helper
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Serve static file helper
const serveStaticFile = (filePath, res) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000' // 1 year cache for static assets
      });
      res.end(content);
      return true;
    }
  } catch (error) {
    console.error('Error serving static file:', error);
  }
  return false;
};

// Google Sheets integration using Cloud Run service account
async function getAccessToken() {
  try {
    // Get access token from metadata service (available in Cloud Run)
    const tokenUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=https://www.googleapis.com/auth/spreadsheets';
    
    return new Promise((resolve, reject) => {
      const req = http.get(tokenUrl, {
        headers: { 'Metadata-Flavor': 'Google' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tokenData = JSON.parse(data);
            console.log('✅ Access token obtained from metadata service');
            resolve(tokenData.access_token);
          } catch (error) {
            console.warn('❌ Failed to parse token response:', error.message);
            resolve(null);
          }
        });
      });
      
      req.on('error', (error) => {
        console.warn('❌ Failed to get access token:', error.message);
        resolve(null);
      });
      
      req.setTimeout(5000, () => {
        console.warn('❌ Token request timeout');
        req.destroy();
        resolve(null);
      });
    });
  } catch (error) {
    console.warn('❌ Error getting access token:', error.message);
    return null;
  }
}

async function saveToGoogleSheets(sessionData) {
  try {
    console.log('🔄 Attempting to save to Google Sheets...');
    
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.warn('❌ No access token available - Google Sheets not configured');
      return false;
    }
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY';
    const { time, showName } = sessionData;
    
    const values = [[
      new Date().toLocaleDateString(),
      time,
      showName || 'Unknown Show'
    ]];
    
    const requestData = JSON.stringify({
      values: values,
      majorDimension: 'ROWS'
    });
    
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;
    
    return new Promise((resolve) => {
      const req = https.request(sheetsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Successfully saved to Google Sheets');
            console.log('📊 Saved data:', { date: new Date().toLocaleDateString(), time, showName });
            resolve(true);
          } else {
            console.error('❌ Google Sheets API error:', res.statusCode, responseData);
            resolve(false);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Failed to save to Google Sheets:', error.message);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        console.warn('❌ Google Sheets request timeout');
        req.destroy();
        resolve(false);
      });
      
      req.write(requestData);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Error in saveToGoogleSheets:', error.message);
    return false;
  }
}

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
  
  // Save session endpoint (POST) - with Google Sheets integration
  if (pathname === '/api/save-session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Session data received:', data);
        
        // Try to save to Google Sheets using service account
        const saved = await saveToGoogleSheets(data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: saved ? 'Session saved to Google Sheets!' : 'Session received (Google Sheets not configured)',
          data: {
            ...data,
            timestamp: new Date().toISOString(),
            savedToSheets: saved
          }
        }));
      } catch (error) {
        console.error('Error processing session data:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Error saving session',
          error: error.message
        }));
      }
    });
    return;
  }
  
  // Root endpoint - serve React app if available, otherwise fallback
  if (pathname === '/' || pathname === '/index.html') {
    if (hasReactApp) {
      const indexPath = path.join(publicPath, 'index.html');
      console.log(`Serving React app index.html from: ${indexPath}`);
      if (serveStaticFile(indexPath, res)) {
        return;
      }
    }
    
    // Fallback HTML if React app not available
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WatchLess - Server</title>
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
          <p><strong>Status:</strong> Running</p>
          <p><strong>React App:</strong> ${hasReactApp ? '✅ Available' : '❌ Not built/found'}</p>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          
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
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Serve static React files
  if (hasReactApp && pathname.startsWith('/static/')) {
    const staticPath = path.join(publicPath, pathname);
    console.log(`Serving static file: ${staticPath}`);
    if (serveStaticFile(staticPath, res)) {
      return;
    }
  }
  
  // Handle other React assets (js, css, etc.)
  if (hasReactApp) {
    const assetPath = path.join(publicPath, pathname);
    if (serveStaticFile(assetPath, res)) {
      return;
    }
  }
  
  // Catch-all for React Router (SPA routing)
  if (hasReactApp && !pathname.startsWith('/api/')) {
    const indexPath = path.join(publicPath, 'index.html');
    console.log(`React Router catch-all for ${pathname} -> serving index.html`);
    if (serveStaticFile(indexPath, res)) {
      return;
    }
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>Path: ${pathname}</p>
      <p>React App: ${hasReactApp ? 'Available' : 'Not found'}</p>
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