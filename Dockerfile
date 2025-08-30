# Multi-stage build optimized for Cloud Run
FROM node:20-alpine AS client-builder

# Copy entire build context first
WORKDIR /app
COPY . .

# Debug: Check what we have
RUN echo "=== Project contents ===" && ls -la ./
RUN echo "=== Client directory ===" && ls -la ./client/ || echo "client directory not found"
RUN echo "=== Current working directory ===" && pwd
RUN find /app -name "package.json" -type f 2>/dev/null || echo "No package.json files found"

# Build client - work from the directory that actually contains package.json
WORKDIR /app/client
RUN echo "=== Current directory after WORKDIR ===" && pwd && ls -la
RUN echo "=== Node and npm versions ===" && node --version && npm --version

# Try to find and use package.json
RUN if [ -f package.json ]; then \
      echo "=== Package.json found, installing dependencies ==="; \
      npm install; \
    else \
      echo "=== Package.json not found in current directory ==="; \
      exit 1; \
    fi

RUN echo "=== Building client ===" && npm run build

# Server stage
FROM node:20-alpine AS server

WORKDIR /app

# Copy project files
COPY . .

# Install server dependencies
WORKDIR /app/server
RUN echo "=== Installing server dependencies ===" && npm ci --only=production --silent

# Copy built client files to serve as static content
COPY --from=client-builder /app/client/build ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Cloud Run uses PORT environment variable
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "index.js"]