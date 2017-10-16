import config from '../../../config';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default (id, data, callback) => {
  const requestOptions = {
    url: config.SERVER_ENDPOINT + id,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.API_KEY,
    },
    method: 'POST',
    // Parse object.body as json
    json: data,
  };
  return new Promise((resolve, reject) => {
    request(requestOptions, callback);
  });
};
