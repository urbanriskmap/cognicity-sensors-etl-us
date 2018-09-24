/**
 * Utility function to compare sensor values
 * @function filterChecks
 * @param {object} properties - Sensor properties returned from sensors API
 * @param {{type: string, values: string[]}[]} conditions - Array of conditions
 * @return {boolean}
 */
exports.filterChecks = (properties, conditions) => {
  if (conditions.length) {
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
  }

  return true;
};

/**
 * Utility function to check if nested properties exist
 * in case of nested properties as arrays, use '0' as string
 * eg. 1 - to check body.value.timeseries.length
 * conditions = ['value', 'timeseries', 'length']
 * eg. 2 - to check body.value[0].timeseries[0].length
 * conditions = ['value', '0', 'timeseries', '0', 'length']
 * @function extractChecks
 * @param {object} body - Body of API response
 * @param {string[]} conditions - Array of nested properties to check
 * @return {boolean}
 */
exports.extractChecks = (body, conditions) => {
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
