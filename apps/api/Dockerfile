# Dockerfile for Backend API (Fly.io, Render, etc.)

# Use official Node.js 20 LTS Alpine image
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy application source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm ci --only=production

# Expose port (configurable via environment)
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "dist/index.js"]
