/**
 * CogniCity Sensor ETL Lambdas configuration
 * @file config.js
 * @return {Object} Configuration
**/

require('dotenv').config({silent: true});

export default {
  USGS_BASE_URL: 'https://waterservices.usgs.gov/nwis/iv/?format=json',

  USGS_COUNTY_CODE: '12011',
  USGS_SITE_STATUS: 'all',
  SENSOR_CODE: process.env.SENSOR_CODE,
  HAS_UPSTREAM_DOWNSTREAM: process.env.HAS_UPSTREAM_DOWNSTREAM,

  RECORDS_PERIOD: process.env.RECORDS_PERIOD,
  RECORDS_INTERVAL: process.env.RECORDS_INTERVAL,

  SFWMD_TIMESERIES_ENDPOINT: 'http://api.sfwmd.gov/v1/data/timeseries?format=json',
  SFWMD_AGGREGATE_ENDPOINT: 'http://api.sfwmd.gov/v1/data/aggregate?format=json&timespanUnit=DAY&calculation=MEAN',

  DEBUG_HTTP_REQUESTS: false,

  SERVER_ENDPOINT: process.env.SERVER_ENDPOINT,
  API_KEY: process.env.API_KEY,
};
