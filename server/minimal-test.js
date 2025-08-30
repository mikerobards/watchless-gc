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

// Basic root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.send(`
    <html>
      <body>
        <h1>WatchLess Server Running</h1>
        <p>Port: ${port}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

// Serve static files if they exist
try {
  const publicPath = path.join(__dirname, 'public');
  console.log('Attempting to serve static files from:', publicPath);
  app.use(express.static(publicPath));
  console.log('Static file serving enabled');
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