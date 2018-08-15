import request from 'request';

/**
 * Utility function to compare sensor values
 * @function checks
 * @param {object} properties - Sensor properties returned from sensors API
 * @param {{type: string, values: string[]}[]} conditions - Array of conditions
 * @return {boolean}
 */
exports.checks = (properties, conditions) => {
  for (let condition of conditions) {
      let comparisonSet = [];

      switch (condition.type) {
        case 'hasProperty':
          if (!properties.hasOwnProperty(condition.values[0])) {
            return false;
          }
          break;

        case 'equate':
          for (let value of condition.values) {
            switch (value.type) {
              case 'property':
                comparisonSet.push(properties[value.value]);
                break;

              case 'value':
                comparisonSet.push(value.value);
                break;

              default:
                return false;
            }
          }

          if (comparisonSet.length !== 2) {
            return false;
          } else {
            if (comparisonSet[0] !== comparisonSet[1]) {
              return false;
            }
          }
          break;

        default:
          return false;
      }
    }

    return true;
};

/**
 * This method fetches sensors stored in the CogniCity database
 * @function fetchSensors
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {{type: {string}, values: {string}[]}[]} conditions
 * @param {string} [agency] - Optional 'agency' query param
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object[]>} - List of stored sensors matching query
 */
exports._fetch = (baseUrl, conditions, agency) => {
  let filteredList = [];

  return new Promise((resolve, reject) => {
    let queryUrl = baseUrl;
    queryUrl += agency ? '?agency=' + agency : '';

    request.get({
      url: queryUrl,
      json: true,
    }, (error, response, body) => {
      if (error) reject(error);

      const features = body.result.features;

      for (const feature of features) {
        if (feature.properties.hasOwnProperty('properties')) {
          const properties = feature.properties.properties;
          properties.id = feature.properties.id;

          if (exports.checks(properties, conditions)) {
            filteredList.push(properties);
          }
        }
      }

      resolve(filteredList);
    });
  });
};
