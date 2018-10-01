import _extract from '../extract';
import _filter from '../filter';
import _compare from './compare';
import _load from '../load';

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

  extractSensors(querySets, sensors) {
    return new Promise((resolve, reject) => {
      if (querySets && this.config.API_ENDPOINT) {
        _extract(
          this.config.API_ENDPOINT,
          querySets,
          this.sensorParams.dataStructureKeys
        )
        .then((result) => {
          resolve(this.utilityMethods.parseSensors(result));
        })
        .catch((error) => reject(error));
      } else if (sensors) {
        resolve(sensors);
      } else {
        reject({log: 'Either of query sets or sensors list required'});
      }
    });
  }

  getFilteredSensorsList() {
    return new Promise((resolve, reject) => {
      _filter(
        this.config.SERVER_ENDPOINT,
        this.sensorParams.filterConditions,
        this.config.SENSOR_AGENCY
      )
      .then((sensors) => {
        let storedSensorUids = [];
        for (const sensor of sensors) {
          storedSensorUids.push(
            sensor[this.config.SENSOR_UID_PROPERTY]
          );
        }
        resolve(storedSensorUids);
      })
      .catch((error) => reject(error));
    });
  }

  compareSensors(sensor, storedUids) {
    return new Promise((resolve, reject) => {
      _compare(
        sensor,
        this.config.SENSOR_UID_PROPERTY,
        storedUids
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
    });
  }

  loadNewSensors(metadata) {
    return new Promise((resolve, reject) => {
      _load(
        this.config.SERVER_ENDPOINT,
        this.config.API_KEY,
        metadata
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
    });
  }

  execute() {
    let etlProcesses = [];

    return new Promise((_resolve, _reject) => {
      // EXTRACT
      this.extractSensors(this.sensorParams.querySets, this.sensorParams.list)
      .then((extractedSensors) => {
        // fatal: if no sensors retrieved, terminate with log message
        if (!extractedSensors.length) {
          _resolve([new Promise((res, rej) => rej(this.msgs.noSensors))]);
        }

        // GET STORED SENSORS
        this.getFilteredSensorsList()
        .then((storedSensorUids) => {
          // ITERATE over extracted sensors
          for (const sensor of extractedSensors) {
            // TRANSFORM if extracted, else pass if from file
            const transformedSensor = this.config.API_ENDPOINT ?
            this.utilityMethods.transform(sensor) : sensor;

            etlProcesses.push(
              new Promise((res, rej) => {
                // COMPARE EXTRACTED WITH STORED
                this.compareSensors(transformedSensor, storedSensorUids)
                .then((sensorToLoad) => {
                  if (sensorToLoad.hasOwnProperty('log')) {
                    // non-fatal: sensor already exists, continue
                    res(this.msgs.sensorExists(sensorToLoad.log));
                  } else {
                    // LOAD
                    this.loadNewSensors(sensorToLoad)
                    .then((result) => res(this.msgs.sensorLoaded(result.id)))

                    // non-fatal: failed to load, continue with rest
                    .catch((err) => res(err.log));
                  }

                // fatal: unknown comparison failed
                }).catch((err) => res(this.msgs.compareError));
              })
            );
          }

          // Return list of promises
          _resolve(etlProcesses);

        // fatal: failed to receive response from sensors endpoint
        }).catch((error) => _reject(this.msgs.serverError(error)));

      // fatal: failed to receive response from agency api
    }).catch((error) => _reject(this.msgs.apiError(error)));
    });
  }
}
