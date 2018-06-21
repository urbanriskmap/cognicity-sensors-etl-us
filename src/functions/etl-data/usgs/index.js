import {EtlData} from './model';
import config from '../../../config';

/**
 * ETL script for adding sensor data
 * @function call-etl-data-methods
 * @param {Object} etl - ETL data model
 * @abstract
 * @return {Promise}
 */
exports.callEtlMethods = (etl) => {
  return new Promise((res, rej) => {
    let processEtl = [];
    let updateCount = 0;

    etl.filterSensors()
    .then((filteredSensorList) => {
      if (!filteredSensorList.length) {
        rej('No sensors exist');
      } else {
        for (let sensor of filteredSensorList) {
          processEtl.push(
            new Promise((resolve, reject) => {
              etl.checkStoredObservations(sensor.id, sensor.uid)
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
                          console.log(result.log);
                          resolve(result.log);
                        } else if (result.hasOwnProperty('success')) {
                          console.log(result.success);
                          updateCount += 1;
                          resolve(result.success);
                        }
                      })
                      .catch((error) => reject(error));
                    })
                    .catch((error) => reject(error));
                  })
                  .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
              })
              .catch((error) => reject(error));
            })
          );
        }

        Promise.all(processEtl)
        .then((messages) => {
          res({
            sensors_updated: updateCount,
            logs: messages,
          });
        })
        .catch((error) => rej(error));
      }
    })
    .catch((error) => rej(error));
  });
};

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

   exports.callEtlMethods(etl)
   .then((successLogs) => callback(null, successLogs))
   .catch((errorLogs) => callback(errorLogs));
 };
