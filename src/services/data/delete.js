import request from 'request';

/**
 * This method loads sensors in to the CogniCity database
 * @function deleteData
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {string} apiKey - API key for post endpoint
 * @param {string} sensorId - Sensor id to delete data for
 * @param {string} dataId - Id of sensor data row to delete
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object>}
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
      if (error) resolve({log: error});

      if (body.statusCode !== 200) resolve({log: error});

      resolve();
    });
  });
};
