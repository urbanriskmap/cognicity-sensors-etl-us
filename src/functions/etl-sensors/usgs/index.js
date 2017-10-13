import etlUsgsSensors from './model';

exports.handler = (event, context, callback) => {
  etlUsgsSensors(callback)
  .getExistingSensors
  .extractUsgsSensors
  .transformAndLoad;

  callback(null, 'ETL process complete');
};
