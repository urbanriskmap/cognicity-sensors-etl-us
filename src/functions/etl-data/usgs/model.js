import config from '../../../config';
import getSensors from '../../../services/getSensors';
import postSensors from '../../../services/postSensors';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default {
  filterSensors() {
    let filteredSensorList = [];
    getSensors()
    .then((body) => {
      const features = body.body.features;

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
      return filteredSensorList;
    })
    .catch((error) => {
      return filteredSensorList;
    });
  },

  extractSensorObservations(pkey, uid) {
    let sensorDataToLoad = [];
    const usgsQuery = config.USGS_BASE_URL
    + '&sites=' + uid
    + '&period=' + config.RECORDS_PERIOD
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
            resolve({
              id: pkey,
              data: sensorDataToLoad,
            });
          } else {
            reject(new Error('Sensor id: ' + pkey +
            ' is inactive or has no new observations in past ' +
            config.RECORDS_INTERVAL.slice(2, -1) + ' hour(s).'));
          }
        }
      });
    });
  },

  compareSensorObservations(sensor) {
    const pkey = sensor.id;
    const lastExtractedObservation = sensor.data[
      sensor.data.length - 1
    ].dateTime;

    return new Promise((resolve, reject) => {
      getSensors(pkey)
      .then((body) => {
        const storedObservations = body.body.properties.observations;
        const lastStoredObservation = storedObservations[
          storedObservations.length - 1
        ].dateTime;

        if (lastExtractedObservation === lastStoredObservation) {
          resolve(sensor);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  },

  loadObservations(sensor) {
    let self = this;
    return new Promise((resolve, reject) => {
      postSensors(
        sensor.id,
        sensor.data,
        self.logResponse
      );
    });
  },

  logResponse(error, response, body) {
    if (error) {
      console.log('Error loading observations');
      console.error(error);
    } else if (body.statusCode !== 200) {
      console.log('Error loading observations');
      console.error(body);
    } else {
      const sensorID = body.body.features[0].properties.id;
      console.log('Sensor added with id = ' + sensorID);
    }
  },
};
