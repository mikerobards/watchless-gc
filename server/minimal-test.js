const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

console.log('Starting minimal server...');
console.log('Port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: port,
    cwd: process.cwd()
  });
});

// API endpoint for saving sessions (minimal version)
app.post('/api/save-session', (req, res) => {
  const { time, showName } = req.body;
  console.log('Session data received:', { time, showName });
  
  // For now, just log and return success
  res.status(200).json({
    message: 'Session received successfully (minimal server)', 
    data: { time, showName, timestamp: new Date().toISOString() }
  });
});

// Basic root endpoint - will be overridden by React router
app.get('/api/status', (req, res) => {
  console.log('Status endpoint requested');
  res.json({
    server: 'WatchLess Minimal',
    port: port,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files if they exist
const fs = require('fs');
const publicPath = path.join(__dirname, 'public');

console.log('=== Static File Setup ===');
console.log('Server directory:', __dirname);
console.log('Looking for public directory at:', publicPath);

try {
  if (fs.existsSync(publicPath)) {
    console.log('✅ Public directory found!');
    const files = fs.readdirSync(publicPath);
    console.log('Files in public directory:', files.slice(0, 15));
    
    // Check for index.html specifically
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html found!');
    } else {
      console.log('❌ index.html NOT found!');
    }
    
    // Enable static file serving
    app.use(express.static(publicPath));
    console.log('✅ Static file serving enabled');
    
  } else {
    console.log('❌ Public directory not found');
    console.log('Contents of server directory:');
    const serverFiles = fs.readdirSync(__dirname);
    console.log(serverFiles);
  }
} catch (error) {
  console.error('Error setting up static files:', error);
}

// Catch-all route for React Router (must be last)
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  console.log(`Request for ${req.path}`);
  
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.log(`index.html not found, sending error for ${req.path}`);
    res.status(404).send(`
      <html>
        <body>
          <h1>WatchLess Server Running</h1>
          <p>React app not available (no index.html found)</p>
          <p>Server: ${process.env.NODE_ENV}</p>
          <p>Try: <a href="/health">/health</a> or <a href="/api/status">/api/status</a></p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server listening on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});