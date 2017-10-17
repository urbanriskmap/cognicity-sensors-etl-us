import etl from './model';

exports.handler = (event, context, callback) => {
  let processEtl = [];

  etl.filterSensors()
  .then((filteredSensorList) => {
    if (!filteredSensorList.length) {
      callback('No sensors exist');
    } else {
      for (let sensor of filteredSensorList) {
        processEtl.push(
          new Promise((resolve, reject) => {
            etl.getStoredObservations(sensor.pkey, sensor.uid)
            .then(etl.extractSensorObservations)
            .then(etl.compareSensorObservations)
            .then(etl.loadObservations)
            .then((result) => {
              if (result.hasOwnProperty('log')) {
                console.log('# ' + result.log);
                resolve(result.log);
              } else if (result.hasOwnProperty('success')) {
                console.log('# ' + result.success);
                resolve(result.success);
              }
            })
            .catch((error) => {
              reject(error);
            });
          })
        );
      }

      console.log('* ' + processEtl.length + ' promises');
      Promise.all(processEtl)
      .then((messages) => {
        console.log('* SUCCESS');
        callback(null, 'ETL process complete');
      })
      .catch((error) => {
        console.log('* ERROR');
        callback(error);
      });
    }
  })
  .catch((error) => {
    callback(error);
  });
};
