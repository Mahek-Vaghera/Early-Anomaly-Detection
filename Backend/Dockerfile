# Production Dockerfile for Node.js Express Backend
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose HTTP port
EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]