const pg = require('pg');

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

// TODO: use handler to update & delete sensors as well
exports.addSensor = (event, context, callback) => {
  let sensorData;
  if (event.body) {
    sensorData = JSON.parse(event.body);
    console.info('The following sensor properties will be inserted:');
    console.info(sensorData);
  } else {
    console.error('No data associated with sensor');
    callback(new Error('No data associated with sensor'));
  }

  // Catch idle connection error
  pool.on('error', (err, client) => {
    console.error('Idle client error');
    // Return error
    callback(err);
  });

  pool.connect((err, client, done) => {
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
    query.on('end', (result) => {
      console.info('Sensor inserted succesfully!');
      // Close DB connection
      done();
      // TODO: Construct response, return sensor id (optional: properties)
      callback(null, result);
    });
  });
};
