FROM node:20-alpine

# Install Chromium and its dependencies
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell Puppeteer to skip downloading its own bundled Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Bundle app source code
COPY . .

# Expose your server port (Render requires a web service to bind to a port)
EXPOSE 10000


#run server.js
CMD ["node", "server.js"]
