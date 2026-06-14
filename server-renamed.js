// Import required modules
const { Client, LocalAuth, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
//const axios = require('axios');
//const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const express = require('express');
const { MysqlStore } = require('wwebjs-mysql');
const mysql = require('mysql2/promise'); // npm install mysql2

// Set the UV_THREADPOOL_SIZE for the native C++ odbc driver
//process.env.UV_THREADPOOL_SIZE = 16;


// Global variable to hold the latest QR code string
let latestQrString = null;
const authtype = 'remote';
let client;
let isReady = false;

let authStrategy, pool, connection, tableInfo, store, endpoint;
if(authtype === 'remote') {

  // 1. Setup MySQL Store
  pool = mysql.createPool({
    host: 'db53126.public.databaseasp.net',
    user: 'db53126',
    password: 'bJ?27%eP#S3w',
    database: 'db53126',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  pool.query('SELECT * FROM tabsquare')
  .then(result => {
    console.log('remote mysql tabsquare', result);
  });
  pool.query('SELECT * FROM wsp_sessions')
  .then(result => {
    console.log('remote mysql wsp_sessions', result);
  });
  //console.log('pool', pool);
  //const store = new MysqlStore({ pool });

  // 1. Create your database connection
  connection = mysql.createConnection({
    host: 'db53126.public.databaseasp.net',
    user: 'db53126',
    password: 'bJ?27%eP#S3w',
    database: 'db53126',
  });

  // 2. Define your table and column mappings
  tableInfo = {
    table: 'wsp_sessions', // Your custom table name
    session_column: 'session_name',
    data_column: 'data',
    updated_at_column: 'updated_at'
  };

  // 3. Initialize the store
  store = new MysqlStore({
    pool: pool,
    tableInfo: tableInfo
  });

  //console.log('store', store);


}

if(authtype === 'remote') {
  authStrategy = new RemoteAuth({
    clientId: 'my-session',
    store: store,
    backupSyncIntervalMs: 120000 
  });
  console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
    'RemoteAuth');
} else {
  authStrategy = new LocalAuth();
  console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
    authtype);

}

const media = MessageMedia.fromFilePath('lake.jpg');
const pdf = MessageMedia.fromFilePath('basic-text.pdf');

// Fetch the PDF from the web link
//const pdf = await MessageMedia.fromUrl(pdfUrl);
    
// Provide the MIME type, raw base64 data string, and the file name
//const mimeType = 'application/pdf';
//const base64Data = 'JVBERi0xLjQKJ...'; // Your raw base64 string here
//const filename = 'Invoice_2026.pdf';
//const pdf = new MessageMedia(mimeType, base64Data, filename);

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
  if(!isReady) {
    return res.status(503).json({ 
        success: false, 
        message: 'WhatsApp client is still initializing or disconnected. Please try again later.' 
    });
  }
    // Access using req.query
    const number = req.query.phone;
    
    const chatId = number + '@c.us';
    sendMessageSafe(chatId, media, {
          caption: 'Hello from whatsapp-web.js! ' + new Date()
        })
        .then(() => {
          console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
            'Message sent successfully!');
          res.status(200).send('Message sent');
        })
        .catch(err => console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          'Error sending message:', err));
    

});

app.get('/pdf', (req, res) => {
    // Access using req.query
    
    const chatId = '919843138190' + '@c.us';
    sendMessageSafe(chatId, pdf, {
          caption: 'Hello from whatsapp-web.js! ' + new Date()
        })
        .then(() => {
          console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
            'Message sent successfully!');
          res.status(200).send('Message sent');
        })
        .catch(err => console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          'Error sending message:', err));
    

});



// 3. Web endpoint to display the QR Code to users
app.get('/qr', async (req, res) => {
  if (isReady) {
      return res.send('<meta http-equiv="refresh" content="15"><h1>WhatsApp is already authenticated and connected!</h1>');
  }

  if (!latestQrString) {
      return res.send('<meta http-equiv="refresh" content="15"><h1>QR code is generating, please refresh in a few seconds...</h1>');
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



function createWhatsAppClient() {
  try {
    // Create a new client instance with local authentication
    console.log('Creating client');
    client = new Client({
        authStrategy: authStrategy, // Saves session so you don't scan QR every time

        
        //webVersionCache: {
        //    type: 'remote',
        //    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        //},
        
        ...[authtype === 'remote'? [{
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
                ]
            },
            // Points to the Chromium binary installed via Docker
            //executablePath: '/usr/bin/chromium-browser' 
          }
        ]: [{
              args: [ '--no-sandbox', '--disable-setuid-sandbox', '--disable-backgrounding-occluded-windows' ]
            }
        ]]
    });



    // Generate QR code in terminal for authentication
    client.on('qr', qr => {
        //console.log('Scan this QR code with your WhatsApp:');
        //qrcodeTerminal.generate(qr, { small: true });

        console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          'New QR Code generated.');
        latestQrString = qr; // Save the raw text string

    });




    // Log when authenticated
    client.on('ready', async () => {
        console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          '✅ WhatsApp Web client is ready!' );

        latestQrString = null; // Clear QR code once authenticated
        isReady = true;

        // 3. Bind the server to 0.0.0.0 as required by Render
        //app.listen(PORT, '0.0.0.0', () => {
        //  console.log(`HTTP server tracking health checks on port ${PORT}`);
        //});


    });

    // Handle authentication success
    client.on('authenticated', async () => {
      console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
        '🔑 Authenticated successfully!');
    });

    // Handle authentication failure
    client.on('auth_failure', msg => {
        console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
          '❌ Authentication failed:', msg);
    });

    // Handle client disconnection
    client.on('disconnected', async (reason) => {
      console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
        '⚠️ Client was logged out:', reason);
      await handleCrashRecovery();
    });


    client.on('remote_session_saved', () => {
      console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
        'Session saved successfully to remote MySQL');
    });

    client.on('message', async (msg) => {

      if (msg.body == 'ping') {
          msg.reply('pong');
          console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
            'Replied to ', msg.from);
      }

    });

    
    
    /*
    // Example Reconnection Logic
    setInterval(async () => {
        try {
            const state = await client.getState();
            if (state === null || state === 'DISCONNECTED') {
                console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
                  'Client is disconnected, attempting to re-initialize...');
                  await client.destroy();
                  await client.initialize();

            }
        } catch (error) {
          console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
            'State check failed:', error);
            await client.destroy();
            await client.initialize(); // Re-initialize on crash

        }
    }, 60000); // Check every 60 seconds
    */

    

    // Start the client
    client.initialize();
  } catch (error) {
    console.error('Fatal: The new Client or initialization call failed entirely:', error);
  }

}


// 2. Fallback Hook: Catch underlying Puppeteer crashes (e.g., target closed, navigation fails)
process.on('unhandledRejection', async (reason, promise) => {
  const errorText = String(reason);
  
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

  if (errorText.includes('detached Frame')) {
      console.error('Detached frame error caught. Re-initializing WhatsApp client...');
      await handleCrashRecovery();

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


async function handleCrashRecovery() {
  isReady = false;
  if (client) {
      try {
          // Force terminate the broken Puppeteer browser
          client.destroy()
          .then(() => {
            console.log('Client destroyed. Re-initializing fresh WhatsApp instance...');
            createWhatsAppClient(); 
          })
      } catch (err) {
          console.error('Error destroying corrupted client:', err.message);
      }
  } else {  
    console.log('Re-initializing fresh WhatsApp instance...');
    // Re-create the object entirely instead of re-running .initialize()
    createWhatsAppClient(); 
  }
}


// Initial boot
createWhatsAppClient();

// 3. Bind the server to 0.0.0.0 as required by Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
    `HTTP server running on port ${PORT}`);
});



async function sendMessageSafe(chatId, media, message) {
    try {
        await client.sendMessage(chatId, media, message);
    } catch (error) {
        if (error.message.includes('detached Frame') ) {
            console.warn(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
              'Frame detached. Re-initializing client state...');
            // Optional: Implement client.destroy() followed by client.initialize() here
            //client.destroy();
            //client.initialize();
            await handleCrashRecovery();
            
        } else {
            console.error(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), 
              'Failed to send message:', error);
        }
    }
}
  
