// Import required modules
const { Client, LocalAuth } = require('whatsapp-web.js');
//const axios = require('axios');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const express = require('express');

// Set the UV_THREADPOOL_SIZE for the native C++ odbc driver
//process.env.UV_THREADPOOL_SIZE = 16;


// Global variable to hold the latest QR code string
let latestQrString = null;
let isReady = false;

const app = express();

// 1. Retrieve the port dynamically provided by Render, defaulting to 10000
const PORT = process.env.PORT || 10000;

// 2. Add a simple health check endpoint for Render's scanner
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});


// 3. Web endpoint to display the QR Code to users
app.get('/qr', async (req, res) => {
  if (isReady) {
      return res.send('<h1>WhatsApp is already authenticated and connected!</h1>');
  }

  if (!latestQrString) {
      return res.send('<h1>QR code is generating, please refresh in a few seconds...</h1>');
  }



  try {
      // Convert the QR text string into a Data URL (base64 encoded image)
      const qrImageDataUrl = await qrcode.toDataURL(latestQrString);
      
      // Serve a simple HTML page displaying the QR code image
      res.send(`
          <!DOCTYPE html>
          <html>
          <head>
              <title>WhatsApp Web Login</title>
              <meta http-equiv="refresh" content="15"> <!-- Autorefreshes page every 15s to fetch updated QR codes -->
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                  img { margin-top: 20px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1); padding: 10px; }
              </style>
          </head>
          <body>
              <h1>Scan this QR code with WhatsApp</h1>
              <p>The page will auto-refresh every 15 seconds to fetch new codes if this one expires.</p>
              <img src="${qrImageDataUrl}" alt="WhatsApp QR Code" />
          </body>
          </html>
      `);
  } catch (err) {
      res.status(500).send(`Error generating QR code image: ${err}` );
  }
});




// Create a new client instance with local authentication
const client = new Client({
    authStrategy: new LocalAuth(), // Saves session so you don't scan QR every time
    
    puppeteer: {
      headless: true,
      args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // Helps save RAM on Render's 512MB free tier
          '--disable-gpu'
      ],
      // Points to the Chromium binary installed via Docker
      //executablePath: '/usr/bin/chromium-browser' 
  }
});



// Generate QR code in terminal for authentication
client.once('qr', qr => {
    //console.log('Scan this QR code with your WhatsApp:');
    //qrcodeTerminal.generate(qr, { small: true });

    console.log('New QR Code generated.');
    latestQrString = qr; // Save the raw text string

});




// Log when authenticated
client.on('ready', async () => {
    console.log('✅ WhatsApp Web client is ready!' );

    latestQrString = null; // Clear QR code once authenticated
    isReady = true;

    // 3. Bind the server to 0.0.0.0 as required by Render
    //app.listen(PORT, '0.0.0.0', () => {
    //  console.log(`HTTP server tracking health checks on port ${PORT}`);
    //});


});

// Handle authentication success
client.on('authenticated', async () => {
  console.log('🔑 Authenticated successfully!');
});

// Handle authentication failure
client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
});

// Handle client disconnection
client.on('disconnected', async (reason) => {
  console.log('⚠️ Client was logged out:', reason);
});


client.on('message', async (msg) => {

  if (msg.body == '!ping') {
      msg.reply('pong');
  }

});

// Start the client
client.initialize();



// 3. Bind the server to 0.0.0.0 as required by Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server running on port ${PORT}`);
});


