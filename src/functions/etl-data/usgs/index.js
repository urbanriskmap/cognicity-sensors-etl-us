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
            .then((sensor) => {
              etl.extractSensorObservations(sensor)
              .then((data) => {
                etl.transform(data)
                .then((sensor) => {
                  etl.compareSensorObservations(sensor)
                  .then((sensor) => {
                    etl.loadObservations(sensor)
                    .then((result) => {
                      if (result.hasOwnProperty('log')) {
                        resolve(result.log);
                      } else if (result.hasOwnProperty('success')) {
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
        console.log(JSON.stringify(result));
        callback(null, result);
      })
      .catch((error) => {
        console.log(JSON.stringify(error));
        callback(error);
      });
    }
  })
  .catch((error) => {
    console.log(JSON.stringify(error));
    callback(error);
  });
};
