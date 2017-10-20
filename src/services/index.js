import request from 'request';

export default {
  getSensors(id, config) {
    return new Promise((resolve, reject) => {
      request.get({
          url: id
            ? config.SERVER_ENDPOINT + id
            : config.SERVER_ENDPOINT,
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

  postSensors(id, data, config) {
    const requestOptions = {
      url: id
        ? config.SERVER_ENDPOINT + id
        : config.SERVER_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY,
      },
      // Parse object.body as json
      json: data,
    };
    return new Promise((resolve, reject) => {
      request.post(requestOptions, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  },
};
