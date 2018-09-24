/**
 * This method compares a sensor's observations against the
 * last stored observations using the dateTime value
 * @function compareObservations
 * @param {object} id - Sensor id
 * @param {string|null} childProperty - Child property to lookup observations
 * @param {object} data - extracted data
 * @param {string} lastUpdated - dateTime string
 * @return {Promise<object|null>} Promise object
 */
export default (id, childProperty, data, lastUpdated) => {
  const logMessage = {
    log: id
    + ': Sensor has no new observations',
  };

  return new Promise((resolve, reject) => {
    if (!lastUpdated) {
      // New data, continue to upload
      resolve();
    } else {
      let lastExtractedObservation;

      if (data) {
        if (childProperty
          && data[childProperty].length
          && data[childProperty][
            data[childProperty].length - 1
          ].hasOwnProperty('dateTime')
        ) {
          lastExtractedObservation = data[childProperty][
            data[childProperty].length - 1
          ].dateTime;
        } else if (!childProperty
          && data.length
          && data[data.length - 1].hasOwnProperty('dateTime')
        ) {
          data[data.length - 1].dateTime;
        }

        reject({log: 'Incongruent data formats, error comparing'});
      }

      if (lastExtractedObservation
        && lastExtractedObservation === lastUpdated
      ) {
        resolve(logMessage);
      } else {
        // New data, continue to upload
        resolve();
      }
    }
  });
};
