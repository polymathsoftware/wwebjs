//restarts successfully after sleep

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isInitializing = false;
let heartbeatInterval;

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
        qrcode.generate(qr, { small: true });

    });

    client.on('ready', () => {
        console.log('WhatsApp Client is READY!');
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

// Start the app
createClient();
