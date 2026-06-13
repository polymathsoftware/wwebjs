const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const express = require('express');

let client;
let isInitializing = false;
let heartbeatInterval;
let latestQrString = null;

const media = MessageMedia.fromFilePath('lake.jpg');

function createClient() {
    if (isInitializing) return;
    isInitializing = true;

    console.log('Initializing WhatsApp client...');
    
    client = new Client({
        authStrategy: new LocalAuth(), // Keeps session saved locally
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                // Crucial flags to prevent Chrome from freezing when backgrounded or asleep:
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED. Please scan if unauthenticated.');
        //qrcodeTerminal.generate(qr, { small: true });
        //console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
        //  'New QR Code generated.');
        latestQrString = qr; // Save the raw text string

    });

    client.on('ready', () => {
        console.log('WhatsApp Client is READY!');
        latestQrString = null; // Clear QR code once authenticated
        isInitializing = false;

        
        const chatId = '919843138190' + '@c.us';
        client.sendMessage(chatId, media, {
          caption: 'Hello from whatsapp-web.js! ' + new Date()
        })
        .then(() => {
          console.log('Message sent.')
        })
        

        startHeartbeat(); // Start checking connection health
    });

    client.on('disconnected', async (reason) => {
        console.log(`Client was disconnected: ${reason}. Attempting restart...`);
        stopHeartbeat();
        await handleRestart();
    });

    // Catch unhandled errors gracefully
    client.initialize().catch(async (err) => {
        console.error('Initialization error:', err.message);
        isInitializing = false;
        await handleRestart();
    });
}

async function handleRestart() {
    stopHeartbeat();
    isInitializing = false;
    
    if (client) {
      try {
        if (client.pupBrowser) {
              // Force the browser process to terminate safely
              await client.pupBrowser.close();
          }
      } catch (error) {
          console.error("Failed to force close browser:", error);
      } finally {
          await client.destroy();
      }
    }

    console.log('Waiting 60 seconds before restarting...');
    setTimeout(() => {
        createClient();
    }, 60000);
}

function startHeartbeat() {
    stopHeartbeat(); // Clear any existing intervals
    
    // Check connection health every 30 seconds
    heartbeatInterval = setInterval(async () => {
        try {
            // getState() will fail or throw a protocol error if the browser died during sleep
            const state = await client.getState(); 
            console.log(`Heartbeat check - Current State: ${state}`);
            
            if (!state || state === 'CONFLICT' || state === 'UNPAIRED') {
                console.log('Unhealthy state detected via heartbeat. Restarting...');
                await handleRestart();
            }
        } catch (error) {
            console.error('Heartbeat failed (Browser link dead after sleep). Triggering restart...');
            await handleRestart();
        }
    }, 30000); 
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}


// 2. Fallback Hook: Catch underlying Puppeteer crashes (e.g., target closed, navigation fails)
process.on('unhandledRejection', async (reason, promise) => {
    const errorText = String(reason);
    
    /*
    // Target common Puppeteer/Chromium crash signatures
    if (errorText.includes('Target closed') || errorText.includes('Session closed')) {
        isReady = false;
  
        console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          'Critical Puppeteer error detected:', errorText);
        
        try {
            await client.destroy();
        } catch (_) {}
        
        process.exit(1);
    }
    */
  
    if (errorText.includes('detached Frame')) {
        console.error('Detached frame error caught. Re-initializing WhatsApp client...');
        await handleRestart();
  
        /*
        try {
            await client.destroy();
        } catch (e) {
            console.error('Error during client destruction:', e.message);
        }
        // Delay before re-initialization to avoid a loop
        setTimeout(() => {
            client.initialize();
        }, 10000);
        */
    }    
  });
  
  

const app = express();


// Middleware to parse JSON and URL-encoded form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Retrieve the port dynamically provided by Render, defaulting to 10000
const PORT = process.env.PORT || 10000;

// 2. Add a simple health check endpoint for Render's scanner
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

app.get('/message', (req, res) => {
    if(isInitializing) {
        return res.status(503).json({ 
            success: false, 
            message: 'WhatsApp client is still initializing or disconnected. Please try again later.' 
        });
    }
    // Access using req.query
    const number = req.query.phone;

    const chatId = number + '@c.us';
    client.sendMessage(chatId, media, {
        caption: 'Hello from whatsapp-web.js! ' + new Date()
        })
    .then(() => {
      console.log('Message sent.');
      res.status(200).send('Message sent');

    })
  

});




// 3. Web endpoint to display the QR Code to users
app.get('/qr', async (req, res) => {
  if (!isInitializing) {
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


// Start the app
createClient();

// 3. Bind the server to 0.0.0.0 as required by Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
        `HTTP server running on port ${PORT}`);
});

  
