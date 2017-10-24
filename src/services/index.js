import request from 'request';

export class Service {
  constructor(config) {
    this.config = config;
  }

  getSensors(id) {
    return new Promise((resolve, reject) => {
      request.get({
          url: id
            ? this.config.SERVER_ENDPOINT + id
            : this.config.SERVER_ENDPOINT,
          json: true,
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
    });
  }

  postSensors(id, data) {
    const requestOptions = {
      url: id
        ? this.config.SERVER_ENDPOINT + id
        : this.config.SERVER_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.API_KEY,
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
  }

  deleteObservations(sensorId, dataId) {
    const requestOptions = {
      url: this.config.SERVER_ENDPOINT + sensorId,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.API_KEY,
      },
      // Parse object.body as json
      json: {
        data_id: dataId,
      },
    };
    return new Promise((resolve, reject) => {
      request.delete(requestOptions, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
}
