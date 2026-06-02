const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Replace with your actual Browserless WebSocket URL
// If using Docker locally, it is often: 'ws://localhost:3000'
const BROWSER_URL = 'wss://production-sfo.browserless.io?token=2UY988BIFnO7yP77b63beb978f99f2080913d812db7427077';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        browserWSEndpoint: BROWSER_URL,
        headless: true, // Browserless handles the headless state
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    // Generate QR in terminal to scan with your phone
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();
