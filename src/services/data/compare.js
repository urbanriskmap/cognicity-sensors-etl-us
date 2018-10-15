/**
 * This method compares a sensor's observations against the
 * last stored observations using the dateTime value
 * @function compareObservations
 * @param {string|null} childProperty - Child property to lookup observations
 * @param {array|object} data - extracted data
 * @param {string} lastUpdated - dateTime string
 * @param {boolean} initializing
 * @return {Promise<object|null>} Promise object
 */
export default (childProperty, data, lastUpdated, initializing) => {
  return new Promise((resolve, reject) => {
    if (initializing) {
      // No previously stored sensor data, continue
      resolve(false);
    } else {
      if (!data) {
        // No data object, exit process
        resolve(true);
      } else {
        let lastObservationDateTime;

        if (childProperty
          && data[childProperty].length
          && data[childProperty][
            data[childProperty].length - 1
          ].hasOwnProperty('dateTime')
        ) {
          lastObservationDateTime = data[childProperty][
            data[childProperty].length - 1
          ].dateTime;
        } else if (!childProperty
          && data.length
          && data[data.length - 1].hasOwnProperty('dateTime')
        ) {
          lastObservationDateTime = data[data.length - 1].dateTime;
        }

        if (!lastObservationDateTime) {
          // No extracted data available, exit process
          resolve(true);
        } else if (lastObservationDateTime === lastUpdated) {
          // Data not updated yet, exit process
          resolve(true);
        } else {
          // New data, continue to upload
          resolve(false);
        }
      }
    }
  });
};
