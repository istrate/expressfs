FROM node:18-alpine

LABEL author="Daniel Istrate" \
      description="ExpressFS - Simple Static File Server" \
      version="2.0.0"

# Create application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY app.js ./
COPY config ./config
COPY middleware ./middleware
COPY routes ./routes
COPY utils ./utils
COPY public ./public

# Create store directory with proper permissions
RUN mkdir -p store && \
    chmod 755 store

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Start application
CMD ["node", "app.js"]
