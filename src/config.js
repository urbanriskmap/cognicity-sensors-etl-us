/**
 * CogniCity Sensor ETL Lambdas configuration
 * @file config.js
 * @return {Object} Configuration
**/

require('dotenv').config({silent: true});

export default {
  USGS_BASE_URL: 'https://waterservices.usgs.gov/nwis/iv/?format=json',

  USGS_COUNTY_CODE: 12011,
  USGS_SITE_STATUS: 'all',
  SENSOR_TYPE: process.env.SENSOR_TYPE,
  SENSOR_CODE: process.env.SENSOR_CODE,
  UP_DOWN_STREAM_VALUES: process.env.UP_DOWN_STREAM_VALUES,

  RECORDS_PERIOD: process.env.RECORDS_PERIOD,
  RECORDS_INTERVAL: process.env.RECORDS_INTERVAL,

  DEBUG_HTTP_REQUESTS: false,

  SERVER_ENDPOINT: process.env.SERVER_ENDPOINT,
  API_KEY: process.env.API_KEY,
};
