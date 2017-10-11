const pg = require('pg');
const dbgeoGen = require('dbgeo_gen');

require('dotenv').config({silent: true});

const pool = new pg.Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  max: process.env.PG_MAX_CLIENTS,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT,
});
const tableName = process.env.TABLE_NAME;

// TODO: Refer http://blog.rowanudell.com/database-connections-in-lambda/
// for optimizing repetitive function invocations
exports.getSensors = (event, context, callback) => {
  console.log('Received ' + event.method + ' request');
  // Construct psql query
  let sensorId = event.id;
  let queryString = 'SELECT * FROM ' + tableName;
  if (sensorId) {
    queryString = queryString + ' WHERE id = ' + sensorId;
  }

  // Catch idle connection error
  pool.on('error', (err, client) => {
    console.error('Idle client error');
    // Return error
    callback(err);
  });

  pool.connect((err, client, done) => {
    console.log('Connected to DB');
    if (err) {
      console.error('Database connection error');
      // Close DB connection
      done();
      // Return error
      callback(err);
    }

    let query = client.query(queryString);
    query.on('row', (row, result) => {
      result.addRow(row);
    });
    query.on('end', (result) => {
      let geoData = result.rows;

      // Convert result into topojson & return
      console.info('Parsing sensors into topojson...');
      dbgeoGen.parse(geoData, {
        outputFormat: 'topojson',
        precision: 8,
      }, (error, output) => {
        if (error) {
          console.error('Data conversion failed');
          // Close DB connection
          done();
          // Return error
          callback(err);
        }
        console.info('Sending sensors data');
        // Close DB connection
        done();

        // Construct response
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify(output),
        };
        callback(null, response);
      });
    });
  });
};
