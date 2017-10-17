import etl from './model';

/**
 * ETL script for adding sensors
 * @function etlUsgsSensors
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @param {Object} callback - Callback (HTTP response)
 * @abstract
 * @return {Object} error / response passed to callback
 */
exports.handler = (event, context, callback) => {
  etl.getExistingSensors()
  .then(etl.extractUsgsSensors)
  .then((sensorsToCompare) => {
    Promise.all(etl.compareSensors(sensorsToCompare))
    .then((addedSensorUids) => {
      console.log(addedSensorUids.length
      + ((addedSensorUids.length === 0 || addedSensorUids.length === 1)
      ? ' sensor'
      : ' sensors')
      + ' added');
      callback(null, 'ETL process complete');
    })
    .catch((error) => {
      callback(error);
    });
  })
  .catch((error) => {
    callback(error);
  });
};
