import {etl} from './model';

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
