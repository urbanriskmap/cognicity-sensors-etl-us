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
  return new Promise((resolve, reject) => {
    // let processEtl = [];
    // let updateCount = 0;

    etl.filterSensors()
    .then((filteredStationList) => {
      if (!filteredStationList.length) {
        reject('No stored stations found');
      } else {
        etl.checkStoredObservations()
        .then((data) => {
          //
        })
        .catch((error) => reject(error));
      }
    })
    .catch((error) => reject(error));
  });
};

/**
 * ETL script for adding sensor data
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
