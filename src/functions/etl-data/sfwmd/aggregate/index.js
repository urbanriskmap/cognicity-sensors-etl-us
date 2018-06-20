import {EtlData} from './model';
import config from '../../../config';

/**
 * ETL script for adding station data
 * @function call-etl-methods
 * @param {Object} etl - ETL data model
 * @abstract
 * @return {Promise}
 */
exports.callEtlMethods = (etl) => {
  return new Promise((res, rej) => {
    let processEtl = [];
    let updateCount = 0;

    etl.filterSensors()
    .then((filteredStationList) => {
      if (!filteredStationList.length) {
        rej('No stored stations found');
      } else {
        for (let station of filteredStationList) {
          processEtl.push(
            new Promise((resolve, reject) => {
              etl.checkStoredObservations(station.sensorId, station.uid)
              .then((station) => {
                etl.extractStationObservations(station)
                .then((data) => {
                  etl.transform(data)
                  .then((station) => {
                    etl.compareStationObservations(station)
                    .then((station) => {
                      etl.loadObservations(station)
                      .then((result) => {
                        if (result.hasOwnProperty('log')) {
                          resolve(result.log);
                        } else if (result.hasOwnProperty('success')) {
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
 * ETL script for adding station data
 * @function etl-data-sfwmd
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @param {Object} callback - Callback (HTTP response)
 * @abstract
 * @return {Object} error / response passed to callback
 */
exports.handler = (event, context, callback) => {
  let etl = new EtlData(config);

  exports.callEtlMethods(etl)
  .then((successLogs) => {
    console.log(JSON.stringify(successLogs));
    callback(null, successLogs);
  })
  .catch((errorLogs) => {
    console.log(JSON.stringify(errorLogs));
    callback(errorLogs);
  });
};
