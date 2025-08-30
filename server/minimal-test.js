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

// Simple fallback route for root
app.get('/', (req, res) => {
  console.log('Root route requested');
  res.send(`
    <html>
      <body>
        <h1>WatchLess Server Running</h1>
        <p>Port: ${port}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p><a href="/health">Health Check</a> | <a href="/api/status">Server Status</a></p>
        <p>React app would be served here once static files are configured.</p>
      </body>
    </html>
  `);
});

// Basic catch-all for other routes
app.get('*', (req, res) => {
  console.log(`Route requested: ${req.path}`);
  res.status(404).send(`
    <html>
      <body>
        <h1>Route Not Found</h1>
        <p>Path: ${req.path}</p>
        <p><a href="/">Home</a> | <a href="/health">Health</a> | <a href="/api/status">Status</a></p>
      </body>
    </html>
  `);
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