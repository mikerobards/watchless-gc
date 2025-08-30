# Simple single-stage build for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Debug what we have
RUN echo "=== Root contents ===" && ls -la
RUN echo "=== Client contents ===" && ls -la client/ || echo "No client dir"
RUN echo "=== Server contents ===" && ls -la server/ || echo "No server dir"

# Build client if it exists
RUN if [ -d "client" ] && [ -f "client/package.json" ]; then \
      echo "Building client..." && \
      cd client && \
      npm install && \
      npm run build && \
      cd ..; \
    else \
      echo "Skipping client build - no client directory or package.json"; \
    fi

# Install server dependencies
RUN if [ -d "server" ] && [ -f "server/package.json" ]; then \
      echo "Installing server deps..." && \
      cd server && \
      echo "=== Server package.json ===" && \
      cat package.json && \
      echo "=== Running npm install ===" && \
      npm install && \
      echo "=== Checking installed modules ===" && \
      ls -la node_modules/ | head -5; \
    else \
      echo "Error: No server directory or package.json"; \
      ls -la server/ || echo "No server directory"; \
      exit 1; \
    fi

# Set working directory to server first
WORKDIR /app/server

# Copy client build to server public directory (from server directory perspective)
RUN if [ -d "../client/build" ]; then \
      echo "Copying client build to public directory..."; \
      cp -r ../client/build ./public; \
      echo "Contents of public directory:"; \
      ls -la ./public/ || echo "Public directory empty"; \
    else \
      echo "Warning: No client build found at ../client/build"; \
      echo "Creating empty public directory"; \
      mkdir -p ./public; \
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

CMD ["node", "index.js"]