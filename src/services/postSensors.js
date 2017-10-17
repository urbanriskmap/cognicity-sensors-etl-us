import config from '../config';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default (id, data) => {
  const requestOptions = {
    url: id ? config.SERVER_ENDPOINT + id : config.SERVER_ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.API_KEY,
    },
    method: 'POST',
    // Parse object.body as json
    json: data,
  };
  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
};
