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
  .then(() => {
    etl.extractUsgsSensors()
    .then(() => {
      etl.transformAndLoad();
    })
    .catch((error) => {
      callback(error);
    });
  })
  .catch((error) => {
    callback(error);
  });

  callback(null, 'ETL process complete');
};
