import request from 'request';

/**
 * Utility function to check if nested properties exist
 * in case of nested properties as arrays, use '0' as string
 * eg. 1 - to check body.value.timeseries.length
 * conditions = ['value', 'timeseries', 'length']
 * eg. 2 - to check body.value[0].timeseries[0].length
 * conditions = ['value', '0', 'timeseries', '0', 'length']
 * @function checks
 * @param {object} body - Body of API response
 * @param {string[]} conditions - Array of nested properties to check
 * @return {boolean}
 */
exports.checks = (body, conditions) => {
  let objectToCheckForProperty = body;

  for (const property of conditions) {
    if (objectToCheckForProperty[property]) {
      objectToCheckForProperty = objectToCheckForProperty[property];
    } else {
      return false;
    }
  }

  return true;
};

/**
 * This method extracts sensors by querying an agency's API
 * @function extractSensors
 * @param {string} baseUrl - Agency API base url for sensors
 * @param {{object}[]} querySets - Query sets in the form of key/value pairs
 * @param {string[]} conditions - Array of conditions, see exports.checks
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object>}
 */
exports._extract = (baseUrl, querySets, conditions) => {
  let queryUrl = baseUrl;

  // Append query params in key value pairs
  for (const querySet of querySets) {
    queryUrl += '&' + Object.keys(querySet)[0]
    + '=' + querySet[Object.keys(querySet)[0]];
  }

  return new Promise((resolve, reject) => {
    request.get({
      url: queryUrl,
      json: true,
    }, (error, response, body) => {
      if (error) reject(error);

      if (body && exports.checks(body, conditions)) {
        resolve(body);
      } else {
        resolve({
          log: 'Error fetching sensors, or incompatible format',
          error: body,
        });
      }
    });
  });
};
