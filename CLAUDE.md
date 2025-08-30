# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

WatchLess is a full-stack application consisting of two main components:

- **Client** (`/client`): React application built with Create React App that provides a timer interface for tracking TV watching sessions. Uses Material-UI for components and implements modal-based "still watching" reminders with audio notifications.
- **Server** (`/server`): Express.js server that handles session data persistence to Google Sheets.

### Key Technical Details

- **Frontend**: React 19.1.1 with Material-UI, implements modal-based user interface
- **Backend**: Express.js server with Google Sheets API integration
- **Data Storage**: Google Sheets API integration for session tracking (requires `credentials.json`)
- **User Reminders**: Modal dialog with audio notification for "still watching" prompts
- **Timer Logic**: Hardcoded 10-second timeout for testing modal reminders
- **Time Formatting**: Session times automatically formatted as HH:MM:SS in Google Sheets
- **Cloud Deployment**: Deployed on Google Cloud Run with pre-built React files

### Application Flow

1. User starts timer for watching session
2. After 10 seconds, modal dialog appears with audio notification asking "Still watching?"
3. User can choose to continue or stop watching
4. Session data (time watched, show name) is saved to Google Sheets when timer stops
5. Time is automatically formatted from seconds to HH:MM:SS format (e.g., 73 seconds → 00:01:13)

## Development Commands

### Server (`/server`)
- `npm start` - Run server with nodemon (auto-restart on changes)
- `npm test` - No tests configured (placeholder command)

### Client (`/client`)  
- `npm start` - Start React development server (port 3000)
- `npm run build` - Build production React app
- `npm test` - Run Jest tests in watch mode
- `npm run eject` - Eject from Create React App (irreversible)

## Configuration Requirements

- **Google Sheets API**: Requires `server/credentials.json` with service account keys for local development
- **Spreadsheet ID**: Configurable via environment variable or hardcoded fallback
- **CORS**: Configured for local development (client on 3000, server on 3001)
- **Cloud Run**: Service account authentication used automatically in production

## Running the Application

### Local Development
1. Start server: `cd server && npm start`
2. Start client: `cd client && npm start` 
3. Client connects to server at `http://localhost:3001`
4. Audio notifications work automatically (no permissions required)

### Production Deployment
- Deployed on Google Cloud Run: https://watchless-972793137170.us-central1.run.app
- Uses `standalone.js` as entry point (defined in Dockerfile)
- Pre-built React files served from `server/public/`
- Google Sheets integration via Cloud Run service account