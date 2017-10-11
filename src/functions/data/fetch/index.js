const pg = require('pg');

require('dotenv').config({silent: true});

const client = new pg.Client({
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});
// const tableName = process.env.TABLE_NAME;

exports.getSensorData = (event, context, callback) => {
  // Ref: http://disq.us/p/1m1rtp4
  // context.callbackWaitsForEmptyEventLoop = false;

  client.connect((err) => {
    if (!err) {
      console.log('DB connection succesful');
      callback(null, 'Success!');
    }
  });
};
