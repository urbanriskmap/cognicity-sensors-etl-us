/**
 * CogniCity Sensor ETL Lambdas configuration
 * @file config.js
 * @return {Object} Configuration
**/

require('dotenv').config({silent: true});

export default {
  API_KEY: process.env.API_KEY,
  SERVER_ENDPOINT: process.env.SERVER_ENDPOINT,
  DEBUG_HTTP_REQUESTS: false,

  // Common
  DATA_TYPE: process.env.DATA_TYPE,
  SENSOR_AGENCY: process.env.SENSOR_AGENCY,
  SENSOR_UID_PROPERTY: process.env.SENSOR_UID_PROPERTY,
  SENSOR_CHILD_PROPERTY: process.env.SENSOR_CHILD_PROPERTY,
  RECORDS_PERIOD: process.env.RECORDS_PERIOD,
  RECORDS_INTERVAL: process.env.RECORDS_INTERVAL,

  // USGS
  USGS_BASE_URL: 'https://waterservices.usgs.gov/nwis/iv/?format=json',
  USGS_COUNTY_CODE: '12011',
  USGS_SITE_STATUS: 'all',
  USGS_SENSOR_CODE: process.env.USGS_SENSOR_CODE,

  // SFWMD
  SFWMD_TIMESERIES_ENDPOINT: 'http://api.sfwmd.gov/v1/data/timeseries?format=json',
  SFWMD_AGGREGATE_ENDPOINT: 'http://api.sfwmd.gov/v1/data/aggregate?format=json&timespanUnit=DAY&calculation=MEAN',

  // NOAA
  NOAA_ENDPOINT: 'https://tidesandcurrents.noaa.gov/api/datagetter?format=json&units=english',
  NOAA_PREDICTION_PERIOD: process.env.NOAA_PREDICTION_PERIOD,
};
