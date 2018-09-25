import stations from './stations';
import _filter from '../../../services/filter';
import _compare from '../../../services/sensors/compare';
import _load from '../../../services/load';

export default class {
  constructor(config) {
    this.config = config;
  }

  execute() {
    const etlProcesses = [];

    // NOTE: change according to sensor data format
    const conditions = [
      {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
    ];

    return new Promise((_resolve, _reject) => {
      // Fetch and store a list of existing station uniqueId's
      let existingStationUids = [];
      _filter(
        this.config.SERVER_ENDPOINT,
        conditions,
        this.config.SENSOR_AGENCY
      )
      .then((existingStations) => {
        for (const existingStation of existingStations) {
          existingStationUids.push(
            existingStation[this.config.SENSOR_UID_PROPERTY]
          );
        }

        // Store extracted stations
        // NOTE: change value according to
        // sensor format as retrieved from API
        const extractedStations = stations.metadata;

        // Iterate over extracted stations
        for (const stationToCompare of extractedStations) {
          etlProcesses.push(
            new Promise((resolve, reject) => {
              // Check if station already exists in database
              _compare(
                stationToCompare,
                this.config.SENSOR_UID_PROPERTY,
                existingStationUids
              )
              .then((metadata) => {
                if (metadata.hasOwnProperty('log')) {
                  // Log: Station already exists
                  resolve(metadata.log);
                }

                // Load station metadata to database
                _load(
                  this.config.SERVER_ENDPOINT,
                  this.config.API_KEY,
                  metadata
                )
                .then((result) => {
                  if (result.hasOwnProperty('success')) {
                    resolve(result);
                  }

                  // Log: Error uploading sensor,
                  // continue with remaining sensors
                  resolve('Unknown error while loading station');
                })
                .catch((error) => {
                  // Fatal: Unexpected promise failure from _load service
                  reject(error.log);
                });
              })
              .catch((error) => {
                // Fatal: Unexpected promise failure from _compare service
                reject(error);
              });
            })
          );
        }

        // Return list of promises with either 'log' or 'success' message
        _resolve(etlProcesses);
      })
      .catch((error) => {
        // Fatal: Failed to receive response from stations endpoint
        _reject(error);
      });
    });
  }
}
