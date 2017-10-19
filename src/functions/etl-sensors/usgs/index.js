import etl from './model';

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
  let processEtl = [];
  let updateCount = 0;

  etl.getExistingSensors()
  .then(etl.extractUsgsSensors)
  .then(({existingSensorUids, usgsSensors}) => {
    for (let sensor of usgsSensors) {
      processEtl.push(
        new Promise((resolve, reject) => {
          etl.compareSensors(sensor, existingSensorUids)
          .then(etl.transform)
          .then(etl.loadSensor)
          .then((result) => {
            if (result.hasOwnProperty('log')) {
              console.log('# ' + result.log);
              resolve(result.log);
            } else {
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
  })
  .catch((error) => {
    callback(error);
  });
};
