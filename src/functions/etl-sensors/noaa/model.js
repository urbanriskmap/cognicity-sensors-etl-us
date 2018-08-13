import request from 'request';

import HttpService from '../../../services';

export class UploadStations {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;
  }

  /**
   * This method gets existing sfwmd stations
   * @function getExistingStations
   * @external {XMLHttpRequest} getSensors
   * @return {Promise} Array of uids (strings)
   */
  getExistingStations() {
    const service = new HttpService(this.config);

    return new Promise((resolve, reject) => {
      service.getSensors('noaa')
      .then((body) => {
        let existingStationIds = [];
        const features = body.result.features;

        if (!features.length) {
          resolve(existingStationIds);
        } else {
          for (let feature of features) {
            if (feature.properties.hasOwnProperty('properties')) {
              const properties = feature.properties.properties;
              if (properties.hasOwnProperty('station')) {
                existingStationIds.push(properties.station);
              }
            }
          }
          resolve(existingStationIds);
        }
      })
      .catch((error) => reject(error));
    });
  }

  /**
   * This method compares stored stations against
   * @function extractUsgsSensors
   * @param {object} station - station interface from station.js
   * @param {string[]} existingStationIds - list of sensor uid's
   * @return {Promise} Promise object
   */
  compareStations(station, existingStationIds) {
    return new Promise((resolve, reject) => {
      let stationExists = false;
      const stationId = station.properties.station;

      if (existingStationIds.length) {
        for (let uidExisting of existingStationIds) {
          if (stationId === uidExisting) {
            stationExists = true;
          }
        }

        if (!stationExists) {
          resolve(station);
        } else {
          resolve({
            log: stationId + ': Station already exists',
          });
        }
      } else {
        resolve(station);
      }
    });
  }

  loadStation(metadata) {
    const service = new HttpService(this.config);

    return new Promise((resolve, reject) => {
      if (metadata.hasOwnProperty('log')) {
        resolve(metadata);
      } else {
        service.postSensors('', metadata)
        .then((body) => {
          if (body.statusCode !== 200) {
            reject(body);
          } else {
            const stationID = body.result.features[0].properties.id;
            resolve({success: stationID + ': Added station'});
          }
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  }
}
