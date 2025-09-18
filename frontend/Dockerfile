# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files from the app directory
COPY frontend/package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code from the app directory
COPY frontend/ .

# Set build-time environment variable for Vite
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Install a simple HTTP server for serving the built files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
