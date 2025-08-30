const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

console.log('Starting WatchLess server...');
console.log('Port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
const publicPath = path.join(__dirname, 'public');
console.log('Setting up static files from:', publicPath);

// Check if public directory exists and log contents
try {
  const fs = require('fs');
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    console.log('✅ Public directory found with files:', files.slice(0, 10));
  } else {
    console.log('❌ Public directory not found at:', publicPath);
  }
} catch (error) {
  console.log('Error checking public directory:', error.message);
}

app.use(express.static(publicPath));

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
    env: process.env.NODE_ENV
  });
});

// Basic root endpoint that serves React app
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Serving React app from:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).send('Frontend not found');
    }
  });
});

// Save session endpoint
app.post('/api/save-session', async (req, res) => {
  const { time, showName } = req.body;
  console.log('Received session data:', { time, showName });

  try {
    const sheets = await getGoogleSheets();
    
    if (!sheets) {
      console.log('Google Sheets not available, returning success anyway');
      res.status(200).send({ 
        message: 'Session received (Google Sheets not configured)', 
        data: { time, showName, timestamp: new Date().toISOString() }
      });
      return;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY';
    const newRow = [new Date().toLocaleDateString(), time, showName];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });

    console.log('Session saved to Google Sheets successfully');
    res.status(200).send({ message: 'Session saved successfully!' });
  } catch (error) {
    console.error('Error in save-session:', error);
    res.status(500).send({ message: 'Error saving session: ' + error.message });
  }
});

// Catch-all handler for React routing
app.get('*', (req, res) => {
  console.log('Catch-all route for:', req.path);
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html for route:', req.path, err);
      res.status(404).send('Page not found');
    }
  });
});

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ WatchLess server listening on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
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