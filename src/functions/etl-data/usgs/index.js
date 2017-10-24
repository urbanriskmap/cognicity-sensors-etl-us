import {EtlData} from './model';
import config from '../../../config';

/**
 * ETL script for adding sensor data
 * @function etl-data-usgs
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @param {Object} callback - Callback (HTTP response)
 * @abstract
 * @return {Object} error / response passed to callback
 */
exports.handler = (event, context, callback) => {
  let etl = new EtlData(config);
  let processEtl = [];
  let updateCount = 0;

  etl.filterSensors()
  .then((filteredSensorList) => {
    if (!filteredSensorList.length) {
      callback('No sensors exist');
    } else {
      for (let sensor of filteredSensorList) {
        processEtl.push(
          new Promise((resolve, reject) => {
            etl.getStoredObservations(sensor.pkey, sensor.uid)
            .then(etl.extractSensorObservations)
            .then(etl.transform)
            .then(etl.compareSensorObservations)
            .then(etl.loadObservations)
            .then((result) => {
              if (result.hasOwnProperty('log')) {
                console.log('# ' + result.log);
                resolve(result.log);
              } else if (result.hasOwnProperty('success')) {
                console.log('# ' + result.success);
                updateCount += 1;
                resolve(result.success);
              }
            })
            .catch((error) => {
              reject(error);
            });
          })
        );
      }

      Promise.all(processEtl)
      .then((messages) => {
        let result = {
          sensors_updated: updateCount,
          logs: messages,
        };
        callback(null, result);
      })
      .catch((error) => {
        callback(error);
      });
    }
  })
  .catch((error) => {
    callback(error);
  });
};
