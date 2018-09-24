import request from 'request';
import {filterChecks} from './utility';

/**
 * This method fetches and filters sensors stored in the CogniCity database
 * @function filterSensors
 * @param {string} baseUrl - CogniCity Sensors API base url
 * @param {{type: {string}, values: {string}[]}[]} conditions
 * @param {string} [agency] - Optional 'agency' query param
 * @external {XMLHttpRequest}
 * @abstract
 * @return {Promise<object[]>} - List of stored sensors matching query
 */
export default (baseUrl, conditions, agency) => {
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

          if (filterChecks(properties, conditions)) {
            filteredList.push(properties);
          }
        }
      }

      resolve(filteredList);
    });
  });
};
