import {EtlSensors} from './model';
import config from '../../../config';

/**
 * ETL script for adding sensors
 * @function etl-sensors-usgs
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @param {Object} callback - Callback (HTTP response)
 * @abstract
 * @return {Object} error / response passed to callback
 */
exports.handler = (event, context, callback) => {
  let etl = new EtlSensors(config);
  let processEtl = [];
  let updateCount = 0;

  etl.getExistingSensors()
  .then((uids) => {
    etl.extractUsgsSensors(uids)
    .then(({existingSensorUids, usgsSensors}) => {
      for (let sensor of usgsSensors) {
        processEtl.push(
          new Promise((resolve, reject) => {
            etl.compareSensors(sensor, existingSensorUids)
            .then((sensor) => {
              etl.transform(sensor)
              .then((sensor) => {
                etl.loadSensor(sensor)
                .then((result) => {
                  if (result.hasOwnProperty('log')) {
                    resolve(result.log);
                  } else {
                    updateCount += 1;
                    resolve(result.success);
                  }
                })
                .catch((error) => {
                  reject(error);
                });
              })
              .catch((error) => {
                reject(error);
              });
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
    })
    .catch((error) => {
      callback(error);
    });
  })
  .catch((error) => {
    callback(error);
  });
};
