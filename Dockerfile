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
      npm ci --only=production; \
    else \
      echo "Error: No server directory or package.json"; \
      exit 1; \
    fi

# Copy client build to server public directory
RUN if [ -d "client/build" ]; then \
      cp -r client/build server/public; \
    else \
      echo "Warning: No client build found"; \
    fi

# Set working directory to server
WORKDIR /app/server

# Expose port and set environment
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "index.js"]