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
    const conditions = [
      {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
    ];

    return new Promise((_resolve, _reject) => {
      // Fetch and store a list of existing station uniqueId's
      let existingStationUids = [];
      _filter(
        this.config.SERVER_ENDPOINT,
        conditions,
        'sfwmd'
      )
      .then((existingStations) => {
        for (const existingStation of existingStations) {
          existingStationUids.push(
            existingStation[this.config.SENSOR_UID_PROPERTY]
          );
        }

        // Store extracted stations
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
                  // Non-fatal: Station already exists
                  resolve(metadata.log);
                }

                // Load station metadata to database
                _load(
                  this.config.SERVER_ENDPOINT,
                  this.config.API_KEY,
                  metadata
                )
                .then((result) => {
                  if (result.hasOwnProperty('log')) {
                    // Non-fatal: Error uploading station
                    // Or bubbled up log message; continue iterating
                    resolve(result.log);
                  }

                  if (result.hasOwnProperty('success')) {
                    resolve(result);
                  }

                  // Non-fatal: Error uploading station
                  resolve('Unknown error while loading station');
                })
                .catch((error) => {
                  // Non-fatal: Unexpected promise failure
                  reject(error);
                });
              })
              .catch((error) => {
                // Non-fatal: Unexpected promise failure
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
