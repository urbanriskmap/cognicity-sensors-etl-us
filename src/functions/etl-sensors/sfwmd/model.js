import {Service} from '../../../services';
import request from 'request';

export class UploadStations {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;
  }

  getExistingStations() {
    const service = new Service(this.config);

    return new Promise((resolve, reject) => {
      service.getSensors()
      .then((body) => {
        let existingStationIds = [];
        const features = body.result.features;

        if (!features.length) {
          resolve(existingStationIds);
        } else {
          for (let feature of features) {
            if (feature.properties.hasOwnProperty('properties')) {
              const properties = feature.properties.properties;
              if (properties.hasOwnProperty('uid')
                && properties.hasOwnProperty('agency')
                && properties.agency === 'sfwmd'
              ) {
                existingStationIds.push(properties.uid);
              }
            }
          }
        }
      })
      .catch((error) => reject(error));
    });
  }

  compareStations(station, existingStationIds) {
    return new Promise((resolve, reject) => {
      let stationExists = false;
      const stationId = station.properties.stationId;

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
    const service = new Service(this.config);

    return new Promise((resolve, reject) => {
      if (metadata.hasOwnProperty('log')) {
        resolve(metadata);
      } else {
        service.postSensors('', metadata)
        .then((body) => {
          if (body.statusCode !== 200) {
            reject(body);
          } else {
            const stationID = body.result.id;
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
