# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

WatchLess is a full-stack application consisting of two main components:

- **Client** (`/client`): React application built with Create React App that provides a timer interface for tracking TV watching sessions. Uses Material-UI for components and implements push notifications via service workers.
- **Server** (`/server`): Express.js server that handles session data persistence to Google Sheets and manages push notification subscriptions using web-push.

### Key Technical Details

- **Frontend**: React 19.1.1 with Material-UI, implements progressive web app features with service workers
- **Backend**: Express.js server on port 3001 with CORS enabled for local development  
- **Data Storage**: Google Sheets API integration for session tracking (requires `credentials.json`)
- **Notifications**: Web Push API implementation with VAPID keys for "still watching" reminders
- **Timer Logic**: Hardcoded 10-second timeout for testing notifications in production

### Communication Flow

1. Client subscribes to push notifications when timer starts
2. Server stores subscription and triggers notifications after timeout
3. Session data (time watched, show name) is saved to Google Sheets when timer stops
4. Push notifications prompt user with "Still watching?" messages

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

- **Google Sheets API**: Requires `server/credentials.json` with service account keys
- **Push Notifications**: VAPID keys are hardcoded in both client and server files
- **Spreadsheet ID**: Hardcoded in `server/index.js:9` for Google Sheets integration
- **CORS**: Configured for local development (client on 3000, server on 3001)

## Running the Application

1. Start server: `cd server && npm start`
2. Start client: `cd client && npm start` 
3. Client connects to server at `http://localhost:3001`
4. Requires notification permissions for full functionality