FROM node:18-slim

WORKDIR /app

# Install dependencies including system libraries for Baileys/Puppeteer if needed
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .

# Expose port (needs to match env var PORT)
EXPOSE 3001

# Start the application
CMD ["node", "index.js"]
