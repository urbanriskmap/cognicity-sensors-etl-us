/**
 * This method compares a sensor against a list of
 * all stored sensors using the unique id value
 * @function compareSensors
 * @param {object} sensor - Sensor interface
 * @param {string} uniqueIdKey - Sensor unique id property
 * @param {string[]} existingSensorUids - list of sensor uid's
 * @return {Promise<object>} Promise object
 */
export default (sensor, uniqueIdKey, existingSensorUids) => {
  return new Promise((resolve, reject) => {
    if (sensor.hasOwnProperty('log')) {
      resolve(sensor);
    } else {
      let sensorExists = false;
      const sensorUid = sensor[uniqueIdKey];

      if (existingSensorUids.length) {
        for (const uidExisting of existingSensorUids) {
          if (sensorUid === uidExisting) {
            sensorExists = true;
            break;
          }
        }

        if (!sensorExists) {
          resolve(sensor);
        } else {
          resolve({
            log: sensorUid + ': Sensor already exists',
          });
        }
      } else {
        resolve(sensor);
      }
    }
  });
};
