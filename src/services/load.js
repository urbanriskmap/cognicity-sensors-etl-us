import request from 'request';

/**
 * This method loads sensors in to the CogniCity database
 * @function load
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {string} apiKey - API key for post endpoint
 * @param {{properties: {object}, location: {object}}} data
 * @param {string} id - Sensor id to post data for
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object>}
 */
export default (baseUrl, apiKey, data, id) => {
  return new Promise((resolve, reject) => {
    // Append 'id' if present
    baseUrl += id ? id : '';

    const requestOptions = {
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      json: data,
    };

    request.post(requestOptions, (error, response, body) => {
      if (error) {
        reject({log: error});
      } else {
        if (body.statusCode !== 200) {
          reject({log: body});
        } else {
          if (!id) {
            // Post sensor metadata
            if (body.result
              && body.result.features
              && body.result.features[0]
              && body.result.features[0].properties
              && body.result.features[0].properties.id
            ) {
              const sensorId = body.result.features[0].properties.id;
              resolve({id: sensorId});
            }

            // Fatal, unknown error
            reject({log: body});
          } else {
            // Post sensor data
            if (body.result
              && body.result.dataId
            ) {
              resolve({newDataId: body.result.dataId});
            }

            // Fatal, unknown error
            reject({log: body});
          }
        }
      }
    });
  });
};
