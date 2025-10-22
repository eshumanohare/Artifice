# Multi-stage Dockerfile for Artifice Dashboard
# Stage 1: Python environment for streaming
FROM python:3.12-slim as python-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python scripts
COPY scripts/ ./scripts/
COPY .cache/ ./.cache/

# Stage 2: Node.js environment for Next.js
FROM node:18-alpine as node-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./

# Build the Next.js application
RUN npm run build

# Final stage: Combined runtime
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python dependencies from python-base
COPY --from=python-base /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=python-base /usr/local/bin /usr/local/bin

# Copy Node.js application from node-base
COPY --from=node-base /app/.next ./.next
COPY --from=node-base /app/package*.json ./
COPY --from=node-base /app/next.config.ts ./
COPY --from=node-base /app/tsconfig.json ./
COPY --from=node-base /app/postcss.config.mjs ./
COPY --from=node-base /app/eslint.config.mjs ./

# Install production dependencies including TypeScript for runtime
RUN npm ci --only=production && npm install typescript

# Copy source files
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/
COPY requirements.txt ./

# Create cache directory
RUN mkdir -p .cache

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/orders || exit 1

# Start the application
CMD ["/app/start.sh"]
