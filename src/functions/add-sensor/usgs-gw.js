const request = require('request');
request.debug = true;

require('dotenv').config({silent: true});

let sensorCount = 0;
const successResponse = (error, response, body) => {
  if (error) {
    console.error(error);
  } else if (body.statusCode !== 200) {
    console.log('Error');
    console.log(body);
  } else if (body.statusCode === 200) {
    console.log('Sensor added');
    sensorCount += 1;
  }
};

exports.addGWSensor = (event, context, callback) => {
  let metadataInDB = [];
  // TODO: add filter parameters in cognicity-sensors getSensors lambda ?
  // to filter sensors in metadata table by optional key:value pair
  // in properties (jsonb) column
  console.log('Sending get request to sensors lambda');
  request.get('https://ckf6kf5dvd.execute-api.us-west-2.amazonaws.com/dev/sensors/',
  (error, response, body1) => {
    if (error) {
      return console.error(error);
    } else {
      console.log('Received data from sensors/metadata');
      let geojson = JSON.parse(body1).body;
      // store uid's from sensors metadata
      for (let feature of geojson.features) {
        if (feature.properties.properties.hasOwnProperty('uid')) {
          metadataInDB.push(feature.properties.properties.uid);
        }
      }

      // Get sensors metadata from USGS source
      request.get('https://waterservices.usgs.gov/nwis/iv/?format=json&countyCd=12011&parameterCd=62610&siteStatus=all',
      (err, resp, body2) => {
        if (err) {
          return console.error(err);
        } else {
          console.log('Received data from USGS GW query');
          let sensors = JSON.parse(body2).value;
          for (let sensor of sensors.timeSeries) {
            let sensorExists = false;

            // Check if sensor unique identifier exists in metadata table
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

              let postRequestOptions = {
                url: 'https://ckf6kf5dvd.execute-api.us-west-2.amazonaws.com/dev/sensors/',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': process.env.API_KEY,
                },
                json: newSensorMetadata,
                // Sets body object to json,
                // assigning {object} to body is not allowed,
                // only string, array or buffer are supported
              };

              request.post(postRequestOptions, successResponse);
            }
          }

          // Send status
          let msg = sensorCount +
          ((sensorCount === 0 || sensorCount === 1) ? ' sensor' : ' sensors') +
          ' added';
          callback(null, msg);
        }
      });
    }
  });
};
