import config from '../../config';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

let metadataInDB = [];

const loadSensorCallback = (error, response, body) => {
  if (error) {
    console.error(error);
  } else if (body.statusCode !== 200) {
    console.log('Error');
    console.error(body);
  } else if (body.statusCode === 200) {
    console.log('Sensor added');
  }
};

const extractSensorsCallback = (error, response, body) => {
  if (error) {
    return console.error(error);
  } else {
    const sensors = JSON.parse(body).value;

    for (let sensor of sensors.timeSeries) {
      let sensorExists = false;

      // Check if sensor unique identifier exists in fetched uid list
      for (let uid of metadataInDB) {
        if (sensor.sourceInfo.siteCode[0].value === uid) {
          sensorExists = true;
          break;
        }
      }

      // Extract sensor properties & POST to /sensors
      if (!sensorExists) {
        let uid = sensor.sourceInfo.siteCode[0].value;
        let sensorType;
        for (let property of sensor.sourceInfo.siteProperty) {
          if (property.name === 'siteTypeCd') {
            sensorType = property.value;
          }
        }

        // Construct body for request
        let newSensorMetadata = {
          properties: {
            uid: uid,
            type: sensorType,
            query_parameters: {
              cb_62610: 'on',
              format: 'rdb',
              site_no: uid,
              period: 2,
            },
          },
          location: {
            lat: sensor.sourceInfo.geoLocation.geogLocation.latitude,
            lng: sensor.sourceInfo.geoLocation.geogLocation.longitude,
          },
        };

        const postRequestOptions = {
          url: config.SERVER_ENDPOINT,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.API_KEY,
          },
          method: 'POST',
          // Parse object.body as json
          json: newSensorMetadata,
        };

        request(postRequestOptions, loadSensorCallback);
      }
    }
  }
};

const getLoadedSensors = (error, response, body) => {
  if (error) {
    console.error(error);
  } else {
    const features = body.body.features;

    // store uid's from sensors in metadata table
    // filtered by sensor type
    for (let feature of features) {
      const properties = feature.properties.properties;
      if (properties.hasOwnProperty('uid')
      && properties.hasOwnProperty('type')
      && properties.type === config.SENSOR_TYPE) {
        metadataInDB.push(properties.uid);
      }
    }

    const usgsQuery = config.USGS_BASE_URL
    + '&countyCd=' + config.USGS_COUNTY_CODE
    + '&parameterCd=' + config.SENSOR_CODE
    + '&siteStatus=' + config.USGS_SITE_STATUS;

    // Get sensors metadata from USGS source
    request({
      url: usgsQuery,
      method: 'GET',
      json: true,
    }, extractSensorsCallback);
  }
};

exports.handler = (event, context, callback) => {
  // TODO: add filter query parameter in cognicity-sensors getSensors lambda ?
  // to filter sensors in metadata table by optional key:value pair
  // in properties (jsonb) column
  // eg. return sensors where properties.type = 'GW'
  request({
      url: config.SERVER_ENDPOINT,
      method: 'GET',
      json: true,
    }, getLoadedSensors);

  callback(null, 'ETL process complete');
};
