const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 8080;

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY';

app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'public')));

async function getAuth() {
  try {
    const auth = new google.auth.GoogleAuth({
      // In Cloud Run, use service account attached to the service
      // or credentials from environment variables
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
  } catch (error) {
    console.warn('Google Auth not available:', error.message);
    return null;
  }
}

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve React app for all non-API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/save-session', async (req, res) => {
  const { time, showName } = req.body;
  console.log('Received session data:', req.body);

  try {
    const sheets = await getAuth();
    
    if (!sheets) {
      console.warn('Google Sheets not available, session data not saved');
      res.status(200).send({ 
        message: 'Session received (Google Sheets not configured)', 
        data: { time, showName, timestamp: new Date().toISOString() }
      });
      return;
    }

    // Convert seconds to HH:MM:SS format
    console.log('Raw time received:', time, 'seconds');
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log('Formatted time:', formattedTime);
    
    // Also create a decimal time value for Google Sheets (fraction of a day)
    const decimalTime = time / 86400; // 86400 seconds in a day
    console.log('Decimal time for Google Sheets:', decimalTime);
    
    const newRow = [new Date().toLocaleDateString(), formattedTime, decimalTime, showName];
    console.log('Row to be saved:', newRow);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
        majorDimension: 'ROWS'
      },
    });

    res.status(200).send({ message: 'Session saved successfully!' });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    res.status(500).send({ message: 'Error saving session.' });
  }
});



// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});