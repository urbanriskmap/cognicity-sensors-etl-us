import {Service} from '../../../services';
import request from 'request';
import Sensors from '../../../library/data';

export class EtlData {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;
    this.sensors = new Sensors(this.config, new Service(this.config));
  }

  // TODO: move to index.js
  filterSensors() {
    const conditions = [
      {
        type: 'hasProperty',
        values: ['uid'],
      },
      {
        type: 'hasProperty',
        values: ['class'],
      },
      {
        type: 'equate',
        values: [
          {
            type: 'property',
            value: 'class',
          },
          {
            type: 'configVariable',
            value: 'SENSOR_CODE',
          },
          // other types:
          // {
          //   type: 'value',
          //   value: 'usgs',
          // },
        ],
      },
    ];

    return new Promise((resolve, reject) => {
      this.sensors.filter(conditions, 'usgs', 'uid')
      .then((list) => resolve(list))
      .catch((error) => reject(error));
    });
  }

  checkStoredObservations(id, uid) {
    return new Promise((resolve, reject) => {
      this.sensors.getStoredObservations('usgs', id)
      .then(({
        checksPassed,
        storedObservations,
        dataId,
      }) => {
        let lastUpdated;
        let hasStoredObs = false;

        if (checksPassed) {
          // process.env passes true / false values as strings
          if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'true'
          && storedObservations.upstream.length
          && storedObservations.upstream[
            storedObservations.upstream.length - 1
          ].hasOwnProperty('dateTime')) {
            lastUpdated = storedObservations.upstream[
              storedObservations.upstream.length - 1].dateTime;
            hasStoredObs = true;
          } else if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'false'
            && storedObservations.length
            && storedObservations[
                storedObservations.length - 1
              ].hasOwnProperty('dateTime')
          ) {
            lastUpdated = storedObservations[
              storedObservations.length - 1].dateTime;
            hasStoredObs = true;
          }
        }

        resolve({
          id: id, // 'id' property in metadata, 'sensorId' in data
          uid: uid, // 'uid' property in metadata
          dataId: dataId ? dataId : null,
          lastUpdated: hasStoredObs ? lastUpdated : null,
        });
      })
      .catch((error) => reject(error));
    });
  }

  extractSensorObservations(sensor) {
    const self = this;
    const usgsQuery = self.config.USGS_BASE_URL
    + '&sites=' + sensor.uid
    + '&period=' + self.config.RECORDS_PERIOD;
    const logMessage = {
      log: sensor.id
      + ': Sensor is inactive or has no new observations in past '
      + self.config.RECORDS_INTERVAL.slice(2, -1) + ' minute(s).',
    };

    return new Promise((resolve, reject) => {
      // Get sensor observations from USGS source
      request.get({
        url: usgsQuery,
        json: true,
      }, (error, response, body) => {
        if (error) {
          resolve({log: error});
        } else {
          if (body.value.timeSeries.length) {
            resolve({
              storedProperties: sensor,
              usgsData: body.value.timeSeries,
            });
          } else {
            resolve(logMessage);
          }
        }
      });
    });
  }

  transform(data) {
    const self = this;
    let observations;
    let transformedData;

    return new Promise((resolve, reject) => {
      if (data.hasOwnProperty('log')) {
        resolve(data);
      } else {
        const sensor = data.storedProperties;
        const sensorData = data.usgsData;

        if (sensorData.length
          && sensorData[0].hasOwnProperty('values')
          && sensorData[0].values.length
          && sensorData[0].values[0].hasOwnProperty('value')
        ) {
          if (self.config.HAS_UPSTREAM_DOWNSTREAM === 'true') {
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
            resolve({
              id: sensor.id,
              dataId: sensor.dataId,
              data: transformedData,
              lastUpdated: sensor.lastUpdated,
            });
          } else {
            observations = sensorData[0].values[0].value;
            transformedData = [];
            for (let observation of observations) {
              transformedData.push({
                dateTime: observation.dateTime,
                value: observation.value,
              });
            }
            resolve({
              id: sensor.id,
              dataId: sensor.dataId,
              data: transformedData,
              lastUpdated: sensor.lastUpdated,
            });
          }
        } else {
          resolve({
            log: sensor.id + ': No valid data available',
          });
        }
      }
    });
  }

  compareSensorObservations(sensor) {
    const logMessage = {
      log: sensor.id
      + ': Sensor has no new observations',
    };

    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        if (!sensor.lastUpdated) {
          resolve(sensor);
        } else {
          let lastExtractedObservation;
          if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'true'
          && sensor.data.upstream.length
          && sensor.data.upstream[sensor.data.upstream.length - 1]
            .hasOwnProperty('dateTime')
          ) {
            lastExtractedObservation = sensor.data.upstream[
                sensor.data.upstream.length - 1].dateTime;
          } else if (this.config.HAS_UPSTREAM_DOWNSTREAM === 'false'
             && sensor.data.length
             && sensor.data[sensor.data.length - 1]
               .hasOwnProperty('dateTime')
          ) {
            lastExtractedObservation = sensor.data[
              sensor.data.length - 1].dateTime;
          }
          if (lastExtractedObservation === sensor.lastUpdated) {
            resolve(logMessage);
          } else {
            resolve(sensor);
          }
        }
      }
    });
  }

  // TODO: move to index.js
  loadObservations(sensor) {
    return new Promise((resolve, reject) => {
      if (sensor.hasOwnProperty('log')) {
        resolve(sensor);
      } else {
        this.sensors.loadObservations(sensor, {
          observations: sensor.data,
        }, 'sensor')
        .then((msg) => resolve(msg))
        .catch((error) => reject(error));
      }
    });
  }
}
