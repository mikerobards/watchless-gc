const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

console.log('=== Starting Minimal Express Server with Google Sheets ===');
console.log('Port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Working directory:', process.cwd());

// Basic middleware
app.use(cors());
app.use(express.json());

// Check for React build files
const publicPath = path.join(__dirname, 'public');
console.log('Checking for React files at:', publicPath);

let hasReactApp = false;
try {
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    hasReactApp = files.includes('index.html');
    console.log('✅ Public directory found with', files.length, 'files');
    console.log('✅ React app available:', hasReactApp);
  } else {
    console.log('❌ No public directory found');
  }
} catch (error) {
  console.log('Error checking React files:', error.message);
}

// Serve static files from React build
if (hasReactApp) {
  app.use(express.static(publicPath));
  console.log('✅ Static file serving enabled');
}

// Lazy-load Google APIs only when needed
let googleSheetsModule = null;
async function getGoogleSheets() {
  if (!googleSheetsModule) {
    try {
      console.log('Loading Google APIs...');
      const { google } = require('googleapis');
      
      const auth = new google.auth.GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
      });
      
      const client = await auth.getClient();
      googleSheetsModule = google.sheets({ version: 'v4', auth: client });
      console.log('Google Sheets API loaded successfully');
      return googleSheetsModule;
    } catch (error) {
      console.warn('Google Sheets API not available:', error.message);
      return null;
    }
  }
  return googleSheetsModule;
}

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: port,
    reactApp: hasReactApp,
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  console.log('Status endpoint requested');
  res.json({
    server: 'WatchLess Express Minimal',
    port: port,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    reactApp: hasReactApp,
    cwd: process.cwd()
  });
});

// Save session endpoint with Google Sheets integration
app.post('/api/save-session', async (req, res) => {
  const { time, showName } = req.body;
  console.log('Session data received:', { time, showName });

  try {
    const sheets = await getGoogleSheets();
    
    if (!sheets) {
      console.log('Google Sheets not available, returning success anyway');
      res.status(200).json({
        message: 'Session received (Google Sheets not configured)', 
        data: { time, showName, timestamp: new Date().toISOString() }
      });
      return;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY';
    const newRow = [new Date().toLocaleDateString(), time, showName];

    console.log('Attempting to save to Google Sheets:', { SPREADSHEET_ID, newRow });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    console.log('✅ Session saved to Google Sheets successfully');
    res.status(200).json({ message: 'Session saved successfully!' });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    res.status(500).json({ message: 'Error saving session: ' + error.message });
  }
});

// Serve React app for all non-API routes (client-side routing)
if (hasReactApp) {
  app.get('*', (req, res) => {
    console.log(`Serving React app for ${req.path}`);
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <body>
        <h1>WatchLess Server</h1>
        <p>React app not found</p>
        <p><a href="/health">Health Check</a> | <a href="/api/status">Status</a></p>
      </body>
      </html>
    `);
  });
}

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Express minimal server listening on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ React app: ${hasReactApp ? 'Available' : 'Not found'}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

// Graceful shutdown handling
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