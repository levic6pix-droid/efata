FROM node:18-slim

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libasound2 \
    libx11-xcb1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libpangocairo-1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files from backend folder
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY backend/ ./

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
