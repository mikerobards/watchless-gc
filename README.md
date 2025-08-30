# WatchLess

A full-stack timer application for tracking TV watching sessions with push notification reminders and automatic data logging to Google Sheets.

## Features

- **Timer Interface**: Clean, Material-UI based React interface for starting/stopping watch sessions
- **Push Notifications**: "Still watching?" reminders after configurable timeout periods
- **Session Tracking**: Automatic logging of watch time and show names to Google Sheets
- **Progressive Web App**: Service worker implementation for offline capabilities
- **Real-time Updates**: Live timer display with session persistence

## Architecture

### Client (`/client`)
- React 19.1.1 application built with Create React App
- Material-UI components for consistent design
- Service worker for push notifications and PWA features
- Runs on port 3000 in development

### Server (`/server`) 
- Express.js REST API server
- Google Sheets API integration for data persistence
- Web Push API for notification management
- CORS enabled for local development
- Runs on port 3001

## Setup

### Prerequisites
- Node.js (version compatible with React 19.1.1)
- Google Cloud Service Account with Sheets API access
- VAPID keys for push notifications

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
   - Update the spreadsheet ID in `server/index.js:9`

5. Configure push notifications:
   - Generate VAPID keys
   - Update VAPID keys in both client and server files

## Running the Application

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
- Service account credentials required in `server/credentials.json`
- Spreadsheet ID hardcoded in server configuration
- Sessions logged with timestamp, duration, and show name

### Push Notifications
- VAPID keys configured in both client and server
- Timeout currently set to 10 seconds for testing
- Requires user permission for notifications

## Security Note

The `server/credentials.json` file containing Google Cloud service account keys should never be committed to version control. It's included in `.gitignore` for security.

## License

MIT License