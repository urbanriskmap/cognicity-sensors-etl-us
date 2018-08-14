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
  PREDICTION_PERIOD: process.env.PREDICTION_PERIOD,

  SFWMD_TIMESERIES_ENDPOINT: 'http://api.sfwmd.gov/v1/data/timeseries?format=json',
  SFWMD_AGGREGATE_ENDPOINT: 'http://api.sfwmd.gov/v1/data/aggregate?format=json&timespanUnit=DAY&calculation=MEAN',

  NOAA_ENDPOINT: 'https://tidesandcurrents.noaa.gov/api/datagetter?format=json&units=english',

  SENSOR_AGENCY: process.env.SENSOR_AGENCY,
  SENSOR_UID_PROPERTY: process.env.SENSOR_UID_PROPERTY,
  DATA_TYPE: process.env.DATA_TYPE,

  DEBUG_HTTP_REQUESTS: false,

  SERVER_ENDPOINT: process.env.SERVER_ENDPOINT,
  API_KEY: process.env.API_KEY,
};
