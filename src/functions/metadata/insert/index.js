const pg = require('pg');

require('dotenv').config({silent: true});

// Connection object
const cn = 'postgres://' + process.env.PG_USER + ':' + process.env.PG_PASSWORD + '@' + process.env.PG_HOST + ':' + process.env.PG_PORT + '/' + process.env.PG_DATABASE + '/?ssl=true';

const pool = new pg.Pool({
  connectionString: cn,
  max: process.env.PG_MAX_CLIENTS,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT,
});
const tableName = process.env.TABLE_NAME;

// TODO: use handler to update & delete sensors as well
exports.addSensor = (event, context, callback) => {
  console.log('Received ' + event.method + ' request');
  let sensorData;
  if (!event.body) {
    console.error('No data associated with sensor');
    // Return error
    callback(new Error('No data associated with sensor'));
  } else {
    sensorData = event.body;
    console.info('The following sensor properties will be inserted:');
    console.info(sensorData);

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

      // Construct psql query
      let queryString = 'INSERT INTO ' + tableName +
        ' (location, instance_region_code, properties) ' +
        'VALUES (ST_GeomFromText(\'POINT(' +
        sensorData.long + ' ' + sensorData.lat + ')\'), ' +
        sensorData.instance_region_code + ', \'' +
        JSON.stringify(sensorData.properties) + '\');';

      let query = client.query(queryString);
      query.on('row', (row, result) => {
        result.addRow(row);
      });
      query.on('end', (result) => {
        console.info('Sensor inserted succesfully!');
        // Close DB connection
        done();

        // Construct response
        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify(result),
        };
        callback(null, response);
      });
    });
  }
};
