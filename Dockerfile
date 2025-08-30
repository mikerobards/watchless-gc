# Multi-stage build for Cloud Run deployment
FROM node:18-alpine AS client-builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ .
RUN npm run build

# Server stage
FROM node:18-alpine AS server

WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ .

# Copy built client files
COPY --from=client-builder /app/client/build ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
USER nodejs

EXPOSE 8080

# Use node instead of nodemon for production
CMD ["node", "index.js"]