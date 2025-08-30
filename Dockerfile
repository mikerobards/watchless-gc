# Simple single-stage build for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Debug what we have in build context
RUN echo "=== Root contents ===" && ls -la
RUN echo "=== Client directory check ===" && \
    if [ -d "client" ]; then \
      echo "Client directory exists, contents:" && \
      ls -la client/ && \
      echo "Looking for package.json:" && \
      ls -la client/package.json || echo "No package.json in client/" && \
      echo "Looking for src directory:" && \
      ls -la client/src/ || echo "No src directory in client/"; \
    else \
      echo "No client directory found"; \
    fi
RUN echo "=== Server contents ===" && ls -la server/ || echo "No server dir"

# Skip React build - using pre-built files from server/public/
RUN echo "=== Using Pre-built React Files ===" && \
    echo "Checking for pre-built React files in server/public/" && \
    ls -la server/public/ && \
    if [ -f "server/public/index.html" ]; then \
      echo "✅ Pre-built React app found in server/public/"; \
    else \
      echo "❌ No pre-built React files found"; \
      exit 1; \
    fi

# Install server dependencies (including Google APIs)
RUN if [ -d "server" ] && [ -f "server/package.json" ]; then \
      echo "Installing server deps with Google APIs support..." && \
      cd server && \
      echo "=== Server package.json ===" && \
      cat package.json && \
      echo "=== Running npm install ===" && \
      npm install && \
      echo "=== Checking Google APIs module ===" && \
      ls -la node_modules/googleapis/ | head -3 || echo "googleapis not found" && \
      echo "=== Checking Express module ===" && \
      ls -la node_modules/express/ | head -3 || echo "express not found"; \
    else \
      echo "Error: No server directory or package.json"; \
      ls -la server/ || echo "No server directory"; \
      exit 1; \
    fi

# Set working directory to server first
WORKDIR /app/server

# Verify React files are already in place
RUN echo "=== Verifying React Files in Public Directory ===" && \
    echo "Contents of public directory:" && \
    ls -la ./public/ && \
    if [ -f "./public/index.html" ]; then \
      echo "✅ React index.html found" && \
      echo "✅ React build successfully available"; \
    else \
      echo "❌ React files not found in public directory" && \
      exit 1; \
    fi

# Expose port and set environment
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Debug final setup
RUN echo "=== Final server setup ===" && \
    pwd && \
    ls -la && \
    echo "=== Public directory ===" && \
    ls -la ./public/ 2>/dev/null || echo "No public directory" && \
    echo "=== Package.json check ===" && \
    ls -la package.json && \
    echo "=== Node modules check ===" && \
    ls -la node_modules/ | head -5

# Use standalone server with Google Sheets integration
CMD ["node", "standalone.js"]