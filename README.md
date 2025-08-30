# WatchLess

A full-stack timer application for tracking TV watching sessions with modal reminders and automatic data logging to Google Sheets.

## Features

- **Timer Interface**: Clean, Material-UI based React interface for starting/stopping watch sessions
- **Modal Reminders**: "Still watching?" dialog with audio notifications after timeout periods
- **Session Tracking**: Automatic logging of watch time and show names to Google Sheets
- **Audio Notifications**: Rich gong sound effects for attention-getting reminders
- **Real-time Updates**: Live timer display with session persistence
- **Time Formatting**: Session times automatically formatted as HH:MM:SS in Google Sheets (e.g., 73 seconds → 00:01:13)
- **Cloud Deployment**: Deployed on Google Cloud Run for production use

## Architecture

### Client (`/client`)
- React 19.1.1 application built with Create React App
- Material-UI components for consistent design
- Modal dialogs for user interaction and reminders
- Runs on port 3000 in development

### Server (`/server`) 
- Express.js REST API server
- Google Sheets API integration for data persistence
- Session data handling and storage
- CORS enabled for local development
- Runs on port 3001

## Setup

### Prerequisites
- Node.js (version compatible with React 19.1.1)
- Google Cloud Service Account with Sheets API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mikerobards/watchless-gc.git
cd watchless
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Configure Google Sheets API:
   - Create a service account in Google Cloud Console
   - Download credentials as `server/credentials.json`
   - Update the spreadsheet ID in server configuration

## Running the Application

### Local Development

1. Start the server:
```bash
cd server
npm start
```

2. Start the client (in a new terminal):
```bash
cd client
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production

The application is deployed on Google Cloud Run: https://watchless-972793137170.us-central1.run.app

- Uses service account authentication (no credentials.json needed)
- Pre-built React files served directly from server
- Automatic scaling and HTTPS

## Development Commands

### Server
- `npm start` - Run with nodemon (auto-restart on changes)
- `npm test` - Run tests (placeholder)

### Client
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run Jest tests
- `npm run eject` - Eject from Create React App

## Configuration

### Google Sheets Integration
- **Local Development**: Service account credentials required in `server/credentials.json`
- **Production**: Uses Cloud Run service account authentication automatically
- Spreadsheet ID configurable via environment variable or hardcoded fallback
- Sessions logged with timestamp, formatted duration (HH:MM:SS), and show name
- Time automatically converts from seconds to readable format (e.g., 73s → 00:01:13)

### User Reminders
- Modal dialog appears after 10 seconds of timer activity
- Audio notification (gong sound) accompanies modal dialog
- No permissions required - works automatically

## Security Note

The `server/credentials.json` file containing Google Cloud service account keys should never be committed to version control. It's included in `.gitignore` for security.

## License

MIT License