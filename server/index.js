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
  const auth = new google.auth.GoogleAuth({
    // In Cloud Run, use service account attached to the service
    // or credentials from environment variables
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
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
    const newRow = [new Date().toLocaleDateString(), time, showName];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
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