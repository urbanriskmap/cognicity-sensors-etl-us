import etl from './model';

exports.handler = (event, context, callback) => {
  let resultMessages = [];
  let recordResult = (result) => {
    if (result.hasOwnProperty('log')) {
      resultMessages.push(new Promise((resolve, reject) => {
        resolve(result.log);
      }));
    } else if (resultMessages.hasOwnProperty('success')) {
      resultMessages.push(new Promise((resolve, reject) => {
        resolve(result.success);
      }));
    }

    return resultMessages;
  };

  etl.filterSensors()
  .then((filteredSensorList) => {
    if (!filteredSensorList.length) {
      callback('No sensors exist');
    } else {
      for (let sensor of filteredSensorList) {
        etl.getStoredObservations(sensor.pkey, sensor.uid)
        .then(etl.extractSensorObservations)
        .then(etl.compareSensorObservations)
        .then(etl.loadObservations)
        .then(recordResult)
        .catch((error) => {
          callback(error);
        });
      }
      Promise.all(resultMessages)
      .then(() => {
        console.log(resultMessages);
        callback(null, 'ETL process complete');
      })
      .catch((error) => callback(error));
    }
  })
  .catch((error) => {
    callback(error);
  });
};
