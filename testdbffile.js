const { DBFFile } = require('dbffile');

async function readDirectly() {
    try {
        // Provide the path to the .dbf file
        const dbf = await DBFFile.open('/polymath/smsexp/smsdata.dbf');
        console.log(`Record count: ${dbf.recordCount}`);
        
        const records = await dbf.readRecords(20);
        for (const record of records) {
            // Your memo field will appear directly as a property in the record object
            console.log(record);
        }
    } catch (err) {
        console.error('Error reading DBF file:', err);
    }
}

readDirectly();
