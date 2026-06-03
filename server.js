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


// 3. Bind the server to 0.0.0.0 as required by Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server tracking health checks on port ${PORT}`);
});


//const odbc = require('odbc');
//const connectionString = 'DSN=Finesse Msg Data;MaintainConnection=False;';

       


//const termImage =require('term-img');
//const supportsTerminalGraphics = require('supports-terminal-graphics');
//const terminalImage = require('terminal-image'); //terminal-image@1.2.1

let lastcontent = '', content, connection, lastsmsid = 70, smsid;

// Create a new client instance with local authentication
const client = new Client({
    authStrategy: new LocalAuth(), // Saves session so you don't scan QR every time
    /*
    puppeteer: {
        headless: true, // Set to false if you want to see the browser
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-background-timer-throttling'
        ]
    }
    */

    
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

    //console.log('odbc connect()');
    //connection = await odbc.connect(connectionString);


    /*
    (async () => {
      const fs = (await import('node:fs')).default;
      // Get your image buffer (e.g., from a file or network request)
      const imageBuffer = fs.readFileSync('lake.jpg');
      //const terminalImage = (await import('terminal-image')).default;
      
      // Output to terminal
      //console.log(await terminalImage.buffer(imageBuffer));
      //console.log(await terminalImage.file('lake.jpg'));
      const termImage = (await import('term-img')).default;
      console.log(termImage(imageBuffer));

      //await draw('lake.jpg');
    })();


    const media = MessageMedia.fromFilePath('lake.jpg');
    */

    /*
    setInterval(() => {
      axios.get('http://192.168.43.234/asp/xpnette/wwebjs.asp')
      .then(res1 => {
        if(res1.data && JSON.stringify(res1.data) !== lastcontent) {
          console.log(res1.data);
          lastcontent = JSON.stringify(res1.data);
  
          
          res1.data.forEach(d => {
            const chatId = d.phone + '@c.us';
            client.sendMessage(chatId, `${d.message}`)
                .then(() => console.log(`Message sent to ${d.phone} successfully!`))
                .catch(err => console.error('Error sending message:', err));
              
          });
          
    
        }
    
      })
      .catch(error => console.error(error));
  
    }, 5000)
    */

    /*
    setInterval(async () => {

      // Establish connection
      try {
        console.log('initializePool()');
        const pool = await initializePool();

        //const time = await connection.query('select {fn CURTIME()} as curtime');
        const time = await pool.query('select {fn CURTIME()} as curtime');
        // Execute a query
        console.log(time[0].curtime, 'pool.query()');
        //const data = await connection.query('SELECT * from smsdata where sendit and smsid > ' + lastsmsid);
        //const data = await pool.query('SELECT * from smsdata where sendit and smsid > ' + lastsmsid);
        const data = await pool.query('SELECT top 1 * from smsdata where sendit order by smsid');
        //console.log(data);
        //data.forEach(row => {
        if(data[0]) {
          for (const row of data) {
            console.log(row); // Access by column name
            const number = '919843138190'; // Replace with recipient's number (with country code, no +)
            const chatId = number + '@c.us';
            lastsmsid = row.SMSID;
            if(row.SMSID === 90) {
              const msg = JSON.parse(row.MESSAGE);
              console.log('msg', msg);
            }
            
            Promise.all([ client.sendMessage(chatId, row.MESSAGE  + ' ' + new Date()) ])
            .then(async () => {
              console.log('Message sent successfully!');
              const time = new Date().toLocaleTimeString('en-IN', 
                { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

              //await connection.query(`update smsdata set sendit = 0, smsdate=date(), smstime='${time}' where smsid = ${row.SMSID}`);
              await pool.query(`update smsdata set sendit = 0, smsdate=date(), smstime='${time}' where smsid = ${row.SMSID}`);
              console.log('time', time);
            })
            .catch(err => console.error('Error sending message:', err))
            .finally(async () => {
              // Close the connection when done
              //await connection.close();
              setTimeout(async () => {
                await pool.close();
                console.log('msg pool closed');
              }, 5000);
              

            });
            

            console.log('lastsmsid', lastsmsid);
            break; //after first row
          }
        } else {
          // Close the connection when done
          //await connection.close();
          await pool.close();
          console.log('nomsg pool closed');

        }
      } catch(err) {
        console.error("error in initializePool", err);
      } 


    }, 5000);
    */


    
    
    // Example: Send a message
    const number = '919843138190'; // Replace with recipient's number (with country code, no +)
    const chatId = number + '@c.us';
    client.sendMessage(chatId, media, {
      caption: 'Hello from whatsapp-web.js! ' + new Date()
    } )
    .then(() => console.log(' Message sent successfully!'))
    .catch(err => console.error('Error sending message:', err));


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
  const chatId = msg.from; // This will be something like '1234567890@c.us'
  console.log('chatId: ', chatId, 'msg', msg);

  if (msg.hasMedia) {
    try {
        // 2. Download the media object (returns MessageMedia)
        const media = await msg.downloadMedia();
        
        // 3. Check if it is an image (mimetype starts with 'image/')
        if (media.mimetype.startsWith('image/')) {
            // Convert base64 data to a Buffer
            const imageBuffer = Buffer.from(media.data, 'base64');
            
            // 4. Render to terminal
            console.log('--- Image Received ---');


            /*
            (async () => {
              //const terminalImage = await import('terminal-image');
              const terminalImage = (await import('terminal-image')).default;

              console.log(await terminalImage.buffer(imageBuffer, { width: '50%', height: '50%' }));
              //console.log(await terminalImage.file('qr.jpg'));
            })();
            */
            

            //console.log(await terminalImage.buffer(imageBuffer,  { width: '50%' }));
            
            const termImage = (await import('term-img')).default;
            console.log(termImage(imageBuffer));
            console.log(`${msg.timestamp}.${media.mimetype.substring(6)}`);
            const fs = (await import('node:fs')).default;
            fs.writeFile(`${msg.timestamp}.${media.mimetype.substring(6)}`, imageBuffer, (err) => {
              if (err) throw err;
              console.log('Image saved successfully!');

  
            });

      

            
            // Display the caption if available (stored in msg.body for media)
            if (msg.body) {
                console.log('Caption:', msg.body);
            }
        }

        /*
        await client.sendMessage(msg.from, media, { 
            sendMediaAsSticker: true,
            stickerName: "Sticker", // Optional metadata
            stickerAuthor: "Polymath"    // Optional metadata
        });
        */

    } catch (err) {
        console.error('Failed to download/display image:', err);
    }
  }


  if (msg.body == '!ping') {

      msg.reply('pong');
  }

  if(msg.body == '!groups') {
    axios.get('http://192.168.43.234/asp/finette/sqlcon.asp?blogbrid=1&blogdate=21+January+2014+15:51:40&exedate=13+July+2024+15:04:03&jsononly=1&shopid=mvl87578&bofy=2026-4-1&form=groups&func=paginate&begrow=1&endrow=100')
    .then(res1 => {
      if(res1.data) {
        console.log(res1.data);

        const message = res1.data[1].map(d => d.gname).join(', ');
        msg.reply(message);
        
  
      }
  
    })
    .catch(error => console.error(error));

  }

  if (msg.body === '!sticker') {
      const media = MessageMedia.fromFilePath('woman.png');
      await client.sendMessage(msg.from, media, { 
          sendMediaAsSticker: true,
          stickerName: "Sticker", // Optional metadata
          stickerAuthor: "Polymath"    // Optional metadata
      });
  }


});

// Start the client
client.initialize();




async function runTaskLoop() {
  
  const pool = await initializePool();

  //const time = await connection.query('select {fn CURTIME()} as curtime');
  const time = await pool.query('select {fn CURTIME()} as curtime');
  // Execute a query
  console.log(time[0].curtime, 'pool.query()');
  //const data = await connection.query('SELECT * from smsdata where sendit and smsid > ' + lastsmsid);
  //const data = await pool.query('SELECT * from smsdata where sendit and smsid > ' + lastsmsid);
  const data = await pool.query('SELECT top 1 * from smsdata where sendit order by smsid');
  //console.log(data);
  //data.forEach(row => {
  if(data[0]) {
    console.log('first row');
    for (const row of data) {
      console.log(row); // Access by column name
      const number = '919843138190'; // Replace with recipient's number (with country code, no +)
      const chatId = number + '@c.us';
      lastsmsid = row.SMSID;
      if(row.SMSID === 90) {
        const msg = JSON.parse(row.MESSAGE);
        console.log('msg', msg);
      }
      
      Promise.all([ client.sendMessage(chatId, row.MESSAGE  + ' ' + new Date()) ])
      .then(async () => {
        console.log('Message sent successfully!');
        const time = new Date().toLocaleTimeString('en-IN', 
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

        //await connection.query(`update smsdata set sendit = 0, smsdate=date(), smstime='${time}' where smsid = ${row.SMSID}`);
        await pool.query(`update smsdata set sendit = 0, smsdate=date(), smstime='${time}' where smsid = ${row.SMSID}`);
        console.log('time', time);
      })
      .catch(err => console.error('Error sending message:', err))
      .finally(async () => {
        // Close the connection when done
        //await connection.close();
        setTimeout(async () => {
          await pool.close();
          console.log('msg pool closed');
        }, 5000);
        

      });
      

      console.log('lastsmsid', lastsmsid);
      break; //after first row
    }
  } else {
    // Close the connection when done
    //await connection.close();
    await pool.close();
    console.log('nomsg pool closed');

  }

  // Call itself after the delay
  setTimeout(runTaskLoop, 10000);
}


async function initializePool() {
  const pool = await odbc.pool({
      connectionString: connectionString,
      initialSize: 4,    // Connections created immediately
      maxSize: 10,       // Max connections allowed in the pool
      incrementSize: 2,  // Connections to add when pool is empty
      connectionTimeout: 10,
      loginTimeout: 10
  });
 
  return pool;
}


async function displayImage(path) {

  (async () => {
    //const terminalImage = await import('terminal-image');
    const supportsTerminalGraphics = (await import('supports-terminal-graphics')).default;

    // Optional: Explicitly check for high-res support if you want different logic for each
    if (supportsTerminalGraphics.stdout.kitty) {
      console.log('Using Kitty protocol for high-res image:');
    } else if (supportsTerminalGraphics.stdout.iterm2) {
      console.log('Using iTerm2 protocol:');
    }

    
  
    

    (async () => {
      const fs = (await import('node:fs')).default;
      // Get your image buffer (e.g., from a file or network request)
      const imageBuffer = fs.readFileSync(path);
      //const terminalImage = (await import('terminal-image')).default;
      const termImage = (await import('term-img')).default;

    

      function fallback() {
        console.log('fallback')
      }
  

      // Output to terminal
      //console.log(await terminalImage.buffer(imageBuffer));
      //console.log(await terminalImage.file('lake.jpg'));
  
      //console.log(termImage(path));
      console.log(termImage(imageBuffer));


    })();

    
  })();
}

//displayImage('lake.jpg');



