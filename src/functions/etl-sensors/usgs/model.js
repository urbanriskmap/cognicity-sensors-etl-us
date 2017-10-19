import config from '../../../config';
import getSensors from '../../../services/getSensors';
import postSensors from '../../../services/postSensors';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default {
  /**
   * This method gets existing sensors via getSensors lambda
   * @function getExistingSensors
   * @external {XMLHttpRequest}
   * @return {Promise}
   */
  getExistingSensors() {
    return new Promise((resolve, reject) => {
      getSensors()
      .then((body) => {
        let existingSensorUids = [];
        const features = body.body.features;

        if (!features.length) {
          console.log('No existing sensors found');
          resolve(existingSensorUids);
        } else {
          console.log('Received ' + features.length + ' stored sensors');
          // store uid's from sensors in metadata table
          // filtered by sensor type
          for (let feature of features) {
            const properties = feature.properties.properties;
            if (properties.hasOwnProperty('uid')
            && properties.hasOwnProperty('class')
            && properties.class === config.SENSOR_CODE) {
              existingSensorUids.push(properties.uid);
            }
          }
          resolve(existingSensorUids);
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  },

  /**
   * This method extracts available sensors by querying USGS API
   * @function extractUsgsSensors
   * @param {string[]} uids - list of sensor uid's in metadata
   * @external {XMLHttpRequest}
   * @abstract
   * @return {Promise} Promise object
   */
  extractUsgsSensors(uids) {
    const usgsQuery = config.USGS_BASE_URL
    + '&countyCd=' + config.USGS_COUNTY_CODE
    + '&parameterCd=' + config.SENSOR_CODE
    + '&siteStatus=' + config.USGS_SITE_STATUS;

    return new Promise((resolve, reject) => {
      // Get sensors metadata from USGS source
      request({
        url: usgsQuery,
        method: 'GET',
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          if (body.value.timeSeries.length) {
            resolve({
              existingSensorUids: uids,
              usgsSensors: body.value.timeSeries,
            });
          } else {
            resolve({
              log: 'No sensors received from USGS API',
            });
          }
        }
      });
    });
  },

  compareSensors(sensor, existingSensorUids) {
    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        let sensorExists = false;
        const uidExtracted = sensor.sourceInfo.siteCode[0].value;

        if (existingSensorUids.length) {
          for (let uidExisting of existingSensorUids) {
            if (uidExtracted === uidExisting) {
              sensorExists = true;
            }
          }
          if (!sensorExists) {
            resolve(sensor);
          } else {
            resolve({
              log: uidExtracted + ': Sensor already exists',
            });
          }
        } else {
          resolve(sensor);
        }
      }
    });
  },

  /**
   * This method posts extracted sensor metadata via addSensor lambda
   * @function transform
   * @param {object} sensor - Sensor properties returned from USGS query
   * @return {object}
   */
  transform(sensor) {
    return new Promise(function(resolve, reject) {
      if (sensor) {
        if (sensor.hasOwnProperty('log')) {
          resolve(sensor);
        } else {
          const uid = sensor.sourceInfo.siteCode[0].value;
          const units = sensor.variable.unit.unitCode;
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
              class: config.SENSOR_CODE,
              units: units,
            },
            location: {
              lat: sensor.sourceInfo.geoLocation.geogLocation.latitude,
              lng: sensor.sourceInfo.geoLocation.geogLocation.longitude,
            },
          };

          resolve(sensorMetadata);
        }
      }
    });
  },

  loadSensor(metadata) {
    return new Promise((resolve, reject) => {
      if (metadata.hasOwnProperty('log')) {
        resolve(metadata);
      } else {
        // Load sensors
        postSensors('', metadata)
        .then((body) => {
          if (body.statusCode !== 200) {
            console.log('Error ' + body.statusCode);
            reject(new Error(body));
          } else {
            const sensorID = body.body.features[0].properties.id;
            resolve({success: sensorID + ': Added sensor'});
          }
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  },
};
