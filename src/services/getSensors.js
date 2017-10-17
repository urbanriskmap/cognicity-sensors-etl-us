import config from '../config';

const request = require('request');
request.debug = config.DEBUG_HTTP_REQUESTS;

export default (id) => {
  return new Promise((resolve, reject) => {
    request({
        url: id ? config.SERVER_ENDPOINT + id : config.SERVER_ENDPOINT,
        method: 'GET',
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
  });
};
