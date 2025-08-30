# Multi-stage build optimized for Cloud Run
FROM node:18-alpine AS client-builder

# Build client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --only=production --silent
COPY client/ .
RUN npm run build

# Server stage
FROM node:18-alpine AS server

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --only=production --silent

# Copy server source
COPY server/ .

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