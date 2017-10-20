import request from 'request';

export default {
  getSensors(id, config) {
    return new Promise((resolve, reject) => {
      request({
          url: id
            ? this.config.SERVER_ENDPOINT + id
            : this.config.SERVER_ENDPOINT,
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

  postSensors(id, data, config) {
    const requestOptions = {
      url: id
        ? this.config.SERVER_ENDPOINT + id
        : this.config.SERVER_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.API_KEY,
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
