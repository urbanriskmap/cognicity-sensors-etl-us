import request from 'request';

/**
 * This method deletes sensor data row for given sensor and data id's
 * @function deleteData
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {string} apiKey - API key for post endpoint
 * @param {string} sensorId - Sensor id to delete data for
 * @param {string} dataId - Id of sensor data row to delete
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object|null>}
 */
export default (baseUrl, apiKey, sensorId, dataId) => {
  const requestOptions = {
    url: baseUrl + sensorId + '/' + dataId,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  };

  return new Promise((resolve, reject) => {
    request.delete(requestOptions, (error, response, body) => {
      if (error) reject({log: error});

      if ((JSON.parse(body)).statusCode !== 200) reject({log: body});

      resolve();
    });
  });
};
