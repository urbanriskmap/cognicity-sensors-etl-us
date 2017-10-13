import config from '../../../config';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

exports.etl = {
  getExistingSensors() {
    let self = this;
    return new Promise(function(resolve, reject) {
      request({
          url: config.SERVER_ENDPOINT,
          method: 'GET',
          json: true,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            self.existingSensorUids = [];
            const features = body.body.features;

            // store uid's from sensors in metadata table
            // filtered by sensor type
            for (let feature of features) {
              const properties = feature.properties.properties;
              if (properties.hasOwnProperty('uid')
              && properties.hasOwnProperty('type')
              && properties.type === config.SENSOR_TYPE) {
                self.existingSensorUids.push(properties.uid);
              }
            }
            resolve();
          }
        });
    });
  },

  extractUsgsSensors() {
    let self = this;
    self.sensorsToLoad = [];
    return new Promise(function(resolve, reject) {
      const usgsQuery = config.USGS_BASE_URL
      + '&countyCd=' + config.USGS_COUNTY_CODE
      + '&parameterCd=' + config.SENSOR_CODE
      + '&siteStatus=' + config.USGS_SITE_STATUS;

      // Get sensors metadata from USGS source
      request({
        url: usgsQuery,
        method: 'GET',
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          const sensors = body.value.timeSeries;

          for (let sensor of sensors) {
            let sensorExists = false;
            const uidExtracted = sensor.sourceInfo.siteCode[0].value;
            for (let uidExisting of self.existingSensorUids) {
              if (uidExtracted === uidExisting) {
                sensorExists = true;
              }
            }
            if (!sensorExists) {
              self.sensorsToLoad.push(sensor);
            }
          }

          resolve();
        }
      });
    });
  },

  transformAndLoad() {
    for (let sensor of this.sensorsToLoad) {
      const uid = sensor.sourceInfo.siteCode[0].value;
      let sensorType;
      for (let property of sensor.sourceInfo.siteProperty) {
        if (property.name === 'siteTypeCd') {
          sensorType = property.value;
        }
      }

      // Construct body for request
      let sensorMetadata = {
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

      const requestOptions = {
        url: config.SERVER_ENDPOINT,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.API_KEY,
        },
        method: 'POST',
        // Parse object.body as json
        json: sensorMetadata,
      };

      request(requestOptions, this.logResponse);
    }
  },

  logResponse(error, response, body) {
    if (error) {
      console.log('Error adding sensor');
      console.error(error);
    } else if (body.statusCode !== 200) {
      console.log('Error adding sensor');
      console.error(error);
    } else {
      const sensorID = body.body.features[0].properties.id;
      console.log('Sensor added with id = ' + sensorID);
    }
  },
};
