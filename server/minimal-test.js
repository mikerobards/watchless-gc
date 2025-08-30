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
try {
  const publicPath = path.join(__dirname, 'public');
  console.log('Attempting to serve static files from:', publicPath);
  
  // Check if public directory exists
  const fs = require('fs');
  if (fs.existsSync(publicPath)) {
    console.log('Public directory found, contents:');
    const files = fs.readdirSync(publicPath);
    console.log(files.slice(0, 10)); // Show first 10 files
    
    app.use(express.static(publicPath));
    console.log('Static file serving enabled');
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      const indexPath = path.join(publicPath, 'index.html');
      console.log(`Serving ${req.path} -> index.html`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(404).send('React app not found');
        }
      });
    });
  } else {
    console.log('Public directory not found at:', publicPath);
  }
} catch (error) {
  console.log('Static file serving disabled:', error.message);
}

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server listening on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});