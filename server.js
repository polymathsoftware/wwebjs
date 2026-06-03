// Import required modules
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Set the UV_THREADPOOL_SIZE for the native C++ odbc driver
process.env.UV_THREADPOOL_SIZE = 16;

const app = express();

// 1. Retrieve the port dynamically provided by Render, defaulting to 10000
const PORT = process.env.PORT || 10000;

// 2. Add a simple health check endpoint for Render's scanner
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

/*
// 3. Bind the server to 0.0.0.0 as required by Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server tracking health checks on port ${PORT}`);
});
*/


//const odbc = require('odbc');
//const connectionString = 'DSN=Finesse Msg Data;MaintainConnection=False;';

       


//const termImage =require('term-img');
//const supportsTerminalGraphics = require('supports-terminal-graphics');
//const terminalImage = require('terminal-image'); //terminal-image@1.2.1

let lastcontent = '', content, connection, lastsmsid = 70, smsid;

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
      executablePath: '/usr/bin/chromium-browser' 
  }
});



// Generate QR code in terminal for authentication
client.on('qr', qr => {
    console.log('Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});




// Log when authenticated
client.on('ready', async () => {
    console.log('✅ WhatsApp Web client is ready!' );

    // 3. Bind the server to 0.0.0.0 as required by Render
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP server tracking health checks on port ${PORT}`);
    });


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

