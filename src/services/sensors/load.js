import request from 'request';

/**
 * This method loads sensors in to the CogniCity database
 * @function loadSensor
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {string} apiKey - API key for post endpoint
 * @param {{properties: {object}, location: {object}}} metadata
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object>}
 */
export default (baseUrl, apiKey, metadata) => {
  return new Promise((resolve, reject) => {
    if (metadata.hasOwnProperty('log')) {
      resolve(metadata);
    } else {
      const requestOptions = {
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        json: metadata,
      };

      request.post(requestOptions, (error, response, body) => {
        if (error) resolve({log: error});

        if (body.statusCode !== 200) resolve({log: body});
        if (body.result
          && body.result.features
          && body.result.features[0]
          && body.result.features[0].properties
          && body.result.features[0].properties.id
        ) {
          const sensorId = body.result.features[0].properties.id;
          resolve({success: sensorId + ': Success adding sensor'});
        } else {
          resolve({log: body});
        }
      });
    }
  });
};
