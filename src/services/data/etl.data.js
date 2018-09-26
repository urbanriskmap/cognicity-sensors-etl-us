import _filter from '../filter';
import _getObs from './storedObservations';
import _extract from '../extract';
import _compare from './compare';
import _load from '../load';
import _delete from './delete';

export default class {
  constructor(
    config,
    sensorParameters,
    utilityMethods,
    logMessages
  ) {
    this.config = config;
    this.sensorParams = sensorParameters;
    this.utilityMethods = utilityMethods;
    this.msgs = logMessages;
  }

  getFilteredSensorsList() {
    return new Promise((resolve, reject) => {
      _filter(
        this.config.SERVER_ENDPOINT,
        this.sensorParams.filterConditions,
        this.config.SENSOR_AGENCY
      )
      .then((sensors) => resolve(sensors))
      .catch((error) => reject(error));
    });
  }

  getStoredObservations(sensorId) {
    return new Promise((resolve, reject) => {
      _getObs(
        this.config.SERVER_ENDPOINT,
        sensorId
      )
      .then(({
        checksPassed,
        storedObs,
        lastDataId,
      }) => {
        let lastUpdated = null;
        let initializing = true;
        if (checksPassed && storedObs) {
          const obsStatus = this.utilityMethods.parseStoredData(storedObs);
          lastUpdated = obsStatus.lastUpdated;
          initializing = obsStatus.isInitializing;
        }

        resolve({
          storedObs: storedObs,
          lastDataId: lastDataId,
          lastUpdated: lastUpdated,
          initializing: initializing,
        });
      })
      .catch((error) => reject(error));
    });
  }

  extractObservationsFromApi(querySets) {
    return new Promise((resolve, reject) => {
      _extract(
        this.config.API_ENDPOINT,
        querySets,
        this.sensorParams.dataStructureKeys
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
    });
  }

  compareObservations(sensorId, obs, lastUpdated, initializing) {
    return new Promise((resolve, reject) => {
      _compare(
        sensorId,
        this.sensorParams.childProperty,
        obs,
        lastUpdated,
        initializing
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
    });
  }

  loadNewObservations(sensorId, obs) {
    return new Promise((resolve, reject) => {
      const data = {
        properties: {
          observations: obs,
        },
      };

      if (this.config.DATA_TYPE) {
        data.properties.type = this.config.DATA_TYPE;
      }

      _load(
        this.config.SERVER_ENDPOINT,
        this.config.API_KEY,
        data,
        sensorId
      )
      .then((updatedDataId) => resolve(updatedDataId))
      .catch((error) => reject(error));
    });
  }

  deleteOldObservations(sensorId, dataId) {
    return new Promise((resolve, reject) => {
      _delete(
        this.config.SERVER_ENDPOINT,
        this.config.API_KEY,
        sensorId,
        dataId
      )
      .then(() => resolve())
      .catch((error) => reject(error));
    });
  }

  execute() {
    let etlProcesses = [];

    return new Promise((_resolve, _reject) => {
      this.getFilteredSensorsList()
      .then((sensors) => {
        // if no sensors retrieved, terminate with log message
        if (!sensors.length) {
          _resolve([new Promise((res, rej) => rej(this.msgs.noSensors))]);
        }

        // iterate over sensors, chain etl processes as promises
        for (const sensor of sensors) {
          const id = sensor.id;
          const querySets = this.utilityMethods.getSensorQuerySets(sensor);

          etlProcesses.push(
            new Promise((res, rej) => {
              // GET STORED DATA
              this.getStoredObservations(id)
              .then(({storedObs, lastDataId, lastUpdated, initializing}) => {
                // EXTRACT
                this.extractObservationsFromApi(querySets)
                .then((result) => {
                  // TRANSFORM EXTRACTED
                  this.utilityMethods.transform(sensor, result)
                  .then((obs) => {
                    // COMPARE EXTRACTED WITH STORED
                    this.compareObservations(id, obs, lastUpdated, initializing)
                    .then((exitProcess) => {
                      if (exitProcess) {
                        res(this.msgs.notUpdated(id));
                      } else {
                        // LOAD
                        this.loadNewObservations(id, obs)
                        .then((newDataId) => {
                          // DELETE PREVIOUS if stored
                          if (lastDataId) {
                            this.deleteOldObservations(id, lastDataId)
                            .then(() => {
                              res(this.msgs.dataUpdated(id, newDataId));
                            }).catch((err) => {
                              rej(this.msgs.deleteError(id, err.log));
                            });
                          } else {
                            res(this.msgs.dataStored(id, newDataId));
                          }

                        // non-fatal: failed to load, continue with others
                        }).catch((err) => res(err.log));
                      }

                    // fatal: comparison failed, incongruent formats
                    }).catch((err) => rej(err.log));

                  // non-fatal: no valid data to transform
                  }).catch((err) => rej(err.log));

                // fatal: failed to receive response from agency api
              }).catch((err) => rej(this.msgs.apiError(querySets, err)));

              // fatal: failed to retrieve stored data for queried sensor
            }).catch((err) => rej(this.msgs.sensorError(id, err)));
            })
          );
        }

        // Return list of promises
        _resolve(etlProcesses);

      // fatal: failed to receive response from sensors endpoint
    }).catch((error) => _reject(this.msgs.serverError(error)));
    });
  }
}
