const odbc = require('odbc');

async function connectToDatabase() {
    try {
        // Connection string example (using a DSN)
        const connectionConfig = 'DSN=Finesse Msg Data';

        
        // Establish connection
        const connection = await odbc.connect(connectionConfig);

        // Execute a query
        const data = await connection.query('SELECT * from smsdata where smsid > 85');
        //console.log(data);
        data.forEach(row => {
          console.log(row); // Access by column name
        });

        // Close the connection when done
        await connection.close();
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

connectToDatabase();
