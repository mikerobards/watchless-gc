const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const port = 3001;

const SPREADSHEET_ID = '1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY';

app.use(cors());
app.use(express.json());

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

app.get('/', (req, res) => {
  res.send('WatchLess server is running!');
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



app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});