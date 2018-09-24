import _filter from '../../../services/filter';
import _getStoredObservations from '../../../services/data/storedObservations';
import _extract from '../../../services/extract';
import _compare from '../../../services/data/compare';
import _load from '../../../services/load';
import _delete from '../../../services/data/delete';

export default class {
  constructor(config) {
    this.config = config;
  }

  parseStoredData(storedObservations) {
    let lastUpdated;

    // process.env passes true / false values as strings
    if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'true'
      && storedObservations.upstream.length
      && storedObservations.upstream[
        storedObservations.upstream.length - 1
      ].hasOwnProperty('dateTime')
    ) {
      lastUpdated = storedObservations.upstream[
        storedObservations.upstream.length - 1
      ].dateTime;
    } else if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'false'
      && storedObservations.length
      && storedObservations[
        storedObservations.length - 1
      ].hasOwnProperty('dateTime')
    ) {
      lastUpdated = storedObservations[
        storedObservations.length - 1
      ].dateTime;
    }

    return lastUpdated;
  }

  transform({storedProperties, data}) {
    let observations;
    let transformedData;

    return new Promise((resolve, reject) => {
      const sensor = storedProperties;
      const sensorData = data;

      if (sensorData.length
        && sensorData[0].hasOwnProperty('values')
        && sensorData[0].values.length
        && sensorData[0].values[0].hasOwnProperty('value')
      ) {
        if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'true') {
          observations = {
            upstream: sensorData[0].values[0].value,
            downstream: sensorData[0].values[1].value,
          };
          transformedData = {
            upstream: [],
            downstream: [],
          };
          for (
            let i = 0, j = 0;
            i < observations.upstream.length
            || j < observations.downstream.length;
            i++, j++
          ) {
            if (observations.upstream[i].hasOwnProperty('value')) {
              transformedData.upstream.push({
                dateTime: observations.upstream[i].dateTime,
                value: observations.upstream[i].value,
              });
            }
            if (observations.downstream[j].hasOwnProperty('value')) {
              transformedData.downstream.push({
                dateTime: observations.downstream[j].dateTime,
                value: observations.downstream[j].value,
              });
            }
          }
          resolve(transformedData);
        } else {
          observations = sensorData[0].values[0].value;
          transformedData = [];
          for (let observation of observations) {
            transformedData.push({
              dateTime: observation.dateTime,
              value: observation.value,
            });
          }
          resolve(transformedData);
        }
      } else {
        resolve({
          log: sensor.id + ': No valid data available',
        });
      }
    });
  }

  execute() {
    const etlProcesses = [];

    // NOTE: change according to sensor data format
    const conditions = [
      {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
      {type: 'hasProperty', values: ['class']},
      {type: 'equate', values: [
        {type: 'property', value: 'class'},
        {type: 'value', value: this.config.SENSOR_CODE},
      ]},
    ];

    return new Promise((_resolve, _reject) => {
      // Fetch a filtered list of existing sensors
      _filter(
        this.config.SERVER_ENDPOINT,
        conditions,
        this.config.SENSOR_AGENCY
      )
      .then((sensors) => {
        if (!sensors.length) {
          etlProcesses.push(
            new Promise((resolve, reject) => {
              reject('No sensors found');
            })
          );

          // Resolve with non-fatal log
          _resolve(etlProcesses);
        }

        // Iterate over existing, filtered sensors
        for (const sensor of sensors) {
          etlProcesses.push(
            new Promise((resolve, reject) => {
              // Get stored observations for sensor
              _getStoredObservations(sensor.id)
              .then(({
                checksPassed,
                storedObservations,
                lastStoredDataId,
              }) => {
                let lastUpdated = null;

                if (checksPassed) {
                  lastUpdated = this.parseStoredData(storedObservations);
                }

                // NOTE: change according to sensor type
                const querySets = [
                  {sites: sensor[this.config.SENSOR_UID_PROPERTY]},
                  {period: this.config.RECORDS_PERIOD},
                ];

                _extract(
                  // NOTE: change according to sensor API
                  this.config.USGS_BASE_URL,
                  querySets,
                  ['value', 'timeSeries', 'length']
                )
                .then((body) => {
                  if (body.hasOwnProperty('log')) {
                    // Non-fatal
                    resolve({
                      log: 'Error fetching sensor data',
                      error: body.log,
                    });
                  }

                  this.transform({
                    storedProperties: sensor,
                    // NOTE: change according to observations
                    // format as retrieved from API
                    data: body.value.timeSeries,
                  })
                  .then((transformedData) => {
                    if (transformedData.hasOwnProperty('log')) {
                      // Non-fatal
                      resolve(transformedData.log);
                    }

                    _compare(
                      sensor.id,
                      transformedData,
                      // NOTE: set to null if transformedData is an array
                      'upstream',
                      lastUpdated
                    )
                    .then((compareResult) => {
                      if (compareResult.hasOwnProperty('log')) {
                        // Non-fatal
                        resolve(compareResult.log);
                      }

                      _load(
                        this.config.SERVER_ENDPOINT,
                        this.config.API_KEY,
                        transformedData,
                        sensor.id
                      )
                      .then((updatedDataId) => {
                        if (updatedDataId.hasOwnProperty('log')) {
                          // Non-fatal
                          resolve(compareResult.log);
                        }

                        if (lastStoredDataId) {
                          _delete(sensor.id, lastStoredDataId)
                          .then((deleteResult) => {
                            if (deleteResult.hasOwnProperty('log')) {
                              // Non-fatal
                              resolve({
                                log: sensor.id +
                                ': Failed to remove previous observations',
                                error: deleteResult.log,
                              });
                            }

                            resolve({
                              success: sensor.id + ': Data for sensor updated '
                              + '(dataId: ' + updatedDataId + ')',
                            });
                          });
                        } else {
                          resolve({
                            success: sensor.id + ': Data for sensor stored '
                            + '(dataId: ' + updatedDataId + ')',
                          });
                        }
                      });
                    })
                    // Non-fatal: Incongruent data formatting, unable to compare
                    .catch((error) => reject(error));
                  });
                })
                // Non-fatal: Failed to receive response from agency API
                .catch((error) => reject(error));
              })
              // Non-fatal: Failed to receive response from sensors/id endpoint
              .catch((error) => reject(error));
            })
          );
        }
      })
      // Fatal: Failed to receive response from sensors endpoint
      .catch((error) => _reject(error));
    });
  }
}
