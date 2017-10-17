import config from '../../../config';
import getSensors from '../../../services/getSensors';
import postSensors from '../../../services/postSensors';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default {
  filterSensors() {
    let filteredSensorList = [];

    return new Promise((resolve, reject) => {
      getSensors()
      .then((body) => {
        const features = body.body.features;
        console.log('Received ' + features.length + ' stored sensors');

        for (let feature of features) {
          const properties = feature.properties.properties;
          if (properties.hasOwnProperty('uid')
          && properties.hasOwnProperty('class')
          && properties.class === config.SENSOR_CODE) {
            filteredSensorList.push({
              pkey: feature.properties.id,
              uid: properties.uid,
            });
          }
        }
        resolve(filteredSensorList);
      })
      .catch((error) => {
        reject(error);
      });
    });
  },

  getStoredObservations(pkey, uid) {
    return new Promise((resolve, reject) => {
      getSensors(pkey)
      .then((body) => {
        let storedObservations;
        let lastStoredObservation;
        if (body.body.properties
        && body.body.properties.hasOwnProperty('observations')) {
          console.log('Sensor ' + pkey + ' has stored observations');
          storedObservations = body.body.properties.observations;
          lastStoredObservation = storedObservations[
            storedObservations.length - 1].dateTime;
          resolve({
            uid: uid,
            pkey: pkey,
            hasStoredObservations: true,
            lastStoredObservation: lastStoredObservation,
          });
        } else {
          console.log('Sensor ' + pkey + ' has no stored observations');
          resolve({
            uid: uid,
            pkey: pkey,
            hasStoredObservations: false,
          });
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  },

  extractSensorObservations(sensor) {
    let sensorDataToLoad = [];
    let usgsQuery = config.USGS_BASE_URL
    + '&sites=' + sensor.uid
    + '&period=' + config.RECORDS_PERIOD;
    + '&modifiedSince=' + config.RECORDS_INTERVAL;

    return new Promise((resolve, reject) => {
      // Get sensor observations from USGS source
      request({
        url: usgsQuery,
        method: 'GET',
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          if (body.value.timeSeries.length) {
            const observations = body.value.timeSeries[0].values[0].value;
            for (let observation of observations) {
              sensorDataToLoad.push({
                dateTime: observation.dateTime,
                value: observation.value,
              });
            }
            console.log('Extracted data for sensor ' + sensor.pkey);
            resolve({
              pkey: sensor.pkey,
              data: sensorDataToLoad,
              lastStoredObservation: sensor.hasStoredObservations
                ? sensor.lastStoredObservation
                : null,
            });
          } else {
            resolve({log: 'Sensor id: ' + sensor.pkey +
            ' is inactive or has no new observations in past ' +
            config.RECORDS_INTERVAL.slice(2, -1) + ' hour(s).'});
          }
        }
      });
    });
  },

  compareSensorObservations(sensor) {
    console.log('Comparing sensor id ' + sensor.pkey);
    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        if (!sensor.lastStoredObservation) {
          resolve(sensor);
        } else {
          const lastExtractedObservation = sensor.data[
            sensor.data.length - 1].dateTime;

          if (lastExtractedObservation === sensor.lastStoredObservation) {
            resolve({log: 'Sensor id: ' + sensor.pkey +
              ' has no new observations'});
          } else {
            resolve(sensor);
          }
        }
      }
    });
  },

  loadObservations(sensor) {
    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        postSensors(sensor.pkey, {
          properties: {
            observations: sensor.data,
          },
        })
        .then((body) => {
          if (body.statusCode !== 200) {
            reject(new Error(body));
          } else {
            const sensorID = body.body[0].sensor_id;
            resolve({success: 'Sensor data added for id = ' + sensorID});
          }
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  },
};
