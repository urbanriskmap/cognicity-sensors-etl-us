import config from '../../../config';
import services from '../../../services';
import request from 'request';
request.debug = config.DEBUG_HTTP_REQUESTS;

export default {
  filterSensors() {
    let filteredSensorList = [];

    return new Promise((resolve, reject) => {
      services.getSensors(null, config)
      .then((body) => {
        const features = body.body.features;

        for (let feature of features) {
          if (feature.properties.hasOwnProperty('properties')) {
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
      services.getSensors(pkey, config)
      .then((body) => {
        let storedObservations;
        let lastUpdated;
        let latestRow = body.body[body.body.length - 1];
        if (latestRow.properties
        && latestRow.properties.hasOwnProperty('observations')
        && (latestRow.properties.observations.length
          || latestRow.properties.observations.upstream.length)) {
          storedObservations = latestRow.properties.observations;
          if (config.UP_DOWN_STREAM_VALUES) {
            lastUpdated = storedObservations.upstream[
              storedObservations.upstream.length - 1].dateTime;
          } else {
            lastUpdated = storedObservations[
              storedObservations.length - 1].dateTime;
          }
          resolve({
            uid: uid,
            pkey: pkey,
            lastUpdated: lastUpdated,
          });
        } else {
          resolve({
            uid: uid,
            pkey: pkey,
            lastUpdated: null,
          });
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  },

  extractSensorObservations(sensor) {
    let usgsQuery = config.USGS_BASE_URL
    + '&sites=' + sensor.uid
    + '&period=' + config.RECORDS_PERIOD;
    + '&modifiedSince=' + config.RECORDS_INTERVAL;
    const logMessage = {
      log: sensor.pkey
      + ': Sensor is inactive or has no new observations in past '
      + config.RECORDS_INTERVAL.slice(2, -1) + ' hour(s).',
    };

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
            resolve({
              storedProperties: sensor,
              usgsData: body.value.timeSeries,
            });
          } else {
            resolve(logMessage);
          }
        }
      });
    });
  },

  transform(data) {
    let observations;
    let transformedData;
    return new Promise((resolve, reject) => {
      if (data.hasOwnProperty('log')) {
        resolve(data);
      } else {
        const sensor = data.storedProperties;
        const sensorData = data.usgsData;
        if (config.UP_DOWN_STREAM_VALUES) {
          observations = {
            upstream: sensorData[0].values[0].value,
            downstream: sensorData[0].values[1].value,
          };
          transformedData = {
            upstream: [],
            downstream: [],
          };
          for (
            let i = 0, j = 0;
            i < observations.upstream.length
            || j < observations.downstream.length;
            i++, j++
          ) {
            if (observations.upstream[i].hasOwnProperty('value')) {
              transformedData.upstream.push({
                dateTime: observations.upstream[i].dateTime,
                value: observations.upstream[i].value,
              });
            }
            if (observations.downstream[j].hasOwnProperty('value')) {
              transformedData.downstream.push({
                dateTime: observations.downstream[j].dateTime,
                value: observations.downstream[j].value,
              });
            }
          }
          resolve({
            pkey: sensor.pkey,
            data: transformedData,
            lastUpdated: sensor.lastUpdated,
          });
        } else {
          observations = sensorData[0].values[0].value;
          transformedData = [];
          for (let observation of observations) {
            transformedData.push({
              dateTime: observation.dateTime,
              value: observation.value,
            });
          }
          resolve({
            pkey: sensor.pkey,
            data: observations,
            lastUpdated: sensor.lastUpdated,
          });
        }
      }
    });
  },

  compareSensorObservations(sensor) {
    const logMessage = {
      log: sensor.pkey
      + ': Sensor has no new observations',
    };
    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        if (!sensor.lastUpdated) {
          resolve(sensor);
        } else {
          let lastExtractedObservation;
          if (config.UP_DOWN_STREAM_VALUES) {
            lastExtractedObservation = sensor.data.upstream[
                sensor.data.upstream.length - 1].dateTime;
          } else {
            lastExtractedObservation = sensor.data[
              sensor.data.length - 1].dateTime;
          }
          if (lastExtractedObservation === sensor.lastUpdated) {
            resolve(logMessage);
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
        services.postSensors(sensor.pkey, {
          properties: {
            observations: sensor.data,
          },
        }, config)
        .then((body) => {
          if (body.statusCode !== 200) {
            console.log(sensor.pkey + ': Error ' + body.statusCode);
            reject(new Error(body));
          } else {
            const sensorID = body.body[0].sensor_id;
            resolve({success: sensorID + ': Data for sensor updated'});
          }
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  },
};
