# Simple single-stage build for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Debug what we have
RUN echo "=== Root contents ===" && ls -la
RUN echo "=== Client contents ===" && ls -la client/ || echo "No client dir"
RUN echo "=== Server contents ===" && ls -la server/ || echo "No server dir"

# Build React client with detailed logging
RUN echo "=== Starting React Build Process ===" && \
    if [ -d "client" ] && [ -f "client/package.json" ]; then \
      echo "✅ Client directory and package.json found" && \
      cd client && \
      echo "=== Installing client dependencies ===" && \
      npm install && \
      echo "=== Running React build ===" && \
      npm run build && \
      echo "=== Checking build output ===" && \
      ls -la build/ && \
      echo "=== Build files created ===" && \
      ls -la build/static/ && \
      cd ..; \
    else \
      echo "❌ Client directory or package.json missing" && \
      ls -la client/ || echo "No client directory" && \
      exit 1; \
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

# Copy client build to server public directory with verification
RUN echo "=== Copying React Build to Server ===" && \
    if [ -d "../client/build" ]; then \
      echo "✅ Client build directory found" && \
      ls -la ../client/build/ && \
      echo "Copying build files to ./public/" && \
      cp -r ../client/build/* ./public/ && \
      echo "✅ Files copied successfully" && \
      echo "Contents of public directory:" && \
      ls -la ./public/ && \
      echo "Checking for index.html:" && \
      ls -la ./public/index.html && \
      echo "✅ React build successfully deployed"; \
    else \
      echo "❌ No client build found at ../client/build" && \
      echo "Available directories:" && \
      ls -la ../ && \
      echo "Creating empty public directory as fallback" && \
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

# Use standalone server with React support (no npm dependencies)
CMD ["node", "standalone.js"]