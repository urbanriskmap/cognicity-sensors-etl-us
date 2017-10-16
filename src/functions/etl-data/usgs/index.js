import etl from './model';

exports.handler = (event, context, callback) => {
  const filteredSensorList = etl.filterSensors();

  if (!filteredSensorList.length) {
    callback('No sensors exist');
  } else {
    for (let sensor of filteredSensorList) {
      etl.extractSensorObservations(sensor.pkey, sensor.uid)
      .then(etl.compareSensorObservations)
      .then(etl.loadObservations)
      .catch((error) => {
        console.error(error);
      });
    }
  }
};
