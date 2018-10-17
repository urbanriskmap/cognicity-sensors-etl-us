import request from 'request';

/**
 * This method deletes sensor data row for given sensor and data id's
 * @function getStoredObservations
 * @param {string} endpoint - CogniCity Sensors API base url
 * @param {string} id - Sensor id to get observations for
 * @param {string} dataType - Optional datatype to filter observations
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object>}
 */
export default (endpoint, id, dataType) => {
  return new Promise((resolve, reject) => {
    let queryUrl = endpoint + id;

    queryUrl += dataType ? '?type=' + dataType : '';

    request.get({
      url: queryUrl,
      json: true,
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        if (body.statusCode !== 200 || !body.result) {
          reject(body);
        }

        let storedObservations;
        let storedObsCheckPassed = false;
        let lastStoredDataId;
        let latestRow;

        if (Array.isArray(body.result) && body.result.length) {
          latestRow = body.result[0];
        }

        if (latestRow
          && latestRow.hasOwnProperty('properties')
          && latestRow.properties
        ) {
          storedObsCheckPassed = true;
          storedObservations = latestRow.properties.observations;
          lastStoredDataId = latestRow.dataId;
        }

        resolve({
          checksPassed: storedObsCheckPassed,
          storedObs: storedObservations,
          lastDataId: lastStoredDataId,
        });
      }
    });
  });
};
