FROM node:18-alpine

WORKDIR /app

# Copy package requirements
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy Express server source code
COPY server/ ./server/

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Run the Express server
CMD ["node", "server/server.js"]
