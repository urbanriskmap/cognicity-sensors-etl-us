import request from 'request';
import {extractChecks} from './utility';

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
export default (baseUrl, querySets, conditions) => {
  let queryUrl = baseUrl;

  // Append query params in key value pairs
  for (const querySet of querySets) {
    queryUrl += '&' + Object.keys(querySet)[0] + '='
    + encodeURIComponent(querySet[Object.keys(querySet)[0]]);
  }

  return new Promise((resolve, reject) => {
    request.get({
      url: queryUrl,
      json: true,
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        if (body && extractChecks(body, conditions)) {
          resolve(body);
        } else {
          reject({log: body});
        }
      }
    });
  });
};
