# Use an official Node.js image with Puppeteer dependencies
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Set environment variables
ENV PORT=3001
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
