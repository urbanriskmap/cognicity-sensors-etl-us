import config from '../config';
import request from 'request';
request.debug = config.DEBUG_HTTP_REQUESTS;

export default {
  getSensors(id) {
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
  },

  postSensors(id, data) {
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
  },
};
