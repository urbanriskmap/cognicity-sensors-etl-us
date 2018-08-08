export default class {
  constructor(config, service) {
    this.config = config;
    this.service = service;
  }

  getWmdQueryTimeFormat() {
    const formatDateString = (date) => {
      return date.getFullYear()
      + '-' + // getMonth returns integer between 0 & 11, required 01 & 12
      (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1)
      + '-' + // getDate returns integer between 1 & 31, required 01 & 31
      (date.getDate() < 10 ? '0' + date.getDate() : date.getDate())
      + // getHours returns integer between 0 & 23, required 00 & 23
      (date.getHours() < 10 ? '0' + date.getHours() : date.getHours())
      + ':00:00:000';
    };

    const periodMilliseconds = parseInt(
      this.config.RECORDS_PERIOD.slice(1, -1),
      10
    ) * 24 * 60 * 60 * 1000;

    const now = new Date();
    const start = new Date(Date.parse(now) - periodMilliseconds);

    const begin = formatDateString(start);
    const end = formatDateString(now);

    return {
      begin: begin,
      end: end,
    };
  }

  check(properties, conditions) {
    for (let condition of conditions) {
      let comparisonSet = [];

      switch (condition.type) {
        case 'hasProperty':
          if (!properties.hasOwnProperty(condition.values[0])) {
            return false;
          }
          break;

        case 'equate':
          for (let value of condition.values) {
            switch (value.type) {
              case 'property':
                comparisonSet.push(properties[value.value]);
                break;

              case 'configVariable':
                comparisonSet.push(this.config[value.value]);
                break;

              case 'value':
                comparisonSet.push(value.value);
                break;

              default:
                return false;
            }
          }

          if (comparisonSet.length !== 2) {
            return false;
          } else {
            if (comparisonSet[0] !== comparisonSet[1]) {
              return false;
            }
          }
          break;

        default:
          return false;
      }
    }

    return true;
  }

  filter(conditions, agency, uid) {
    let filteredList = [];

    return new Promise((resolve, reject) => {
      this.service.getSensors(agency)
      .then((body) => {
        const features = body.result.features;

        for (let feature of features) {
          if (feature.properties.hasOwnProperty('properties')) {
            const properties = feature.properties.properties;

            if (this.check(properties, conditions)) {
              filteredList.push({
                id: feature.properties.id,
                uid: properties[uid],
              });
            }
          }
        }

        resolve(filteredList);
      })
      .catch((error) => reject(error));
    });
  }

  getStoredObservations(agency, id, type) {
    return new Promise((resolve, reject) => {
      this.service.getSensors(agency, id, type)
      .then((body) => {
        let storedObservations;
        let storedObsCheckPassed = false;
        let dataId;
        let latestRow;

        if (body.result && body.result.length) {
          latestRow = body.result[body.result.length - 1];
          // REVIEW storedObsCheckPassed = true;
        }

        if (latestRow
          && latestRow.hasOwnProperty('properties')
          && latestRow.properties
          && latestRow.properties.hasOwnProperty('observations')
        ) {
          storedObsCheckPassed = true;
          storedObservations = latestRow.properties.observations;
          dataId = latestRow.dataId;
        }

        resolve({
          checksPassed: storedObsCheckPassed,
          storedObservations: storedObservations,
          dataId: dataId,
        });
      }).catch((error) => reject(error));
    });
  }

  loadObservations(sensor, data, name) {
    return new Promise((resolve, reject) => {
      this.service.postSensors(sensor.id, {
        properties: data,
      })
      .then((body) => {
        if (body.statusCode !== 200) {
          reject(body);
        } else {
          const sensorId = body.result.sensorId;
          const dataId = body.result.dataId;

          if (sensor.dataId
            && Number.isInteger(parseInt(sensor.dataId, 10))
          ) {
            this.service.deleteObservations(sensor.id, sensor.dataId)
            .then(() => {
              resolve({
                success: sensorId + ': Data for ' + name + ' updated '
                + '(dataId: ' + dataId + ')',
              });
            })
            .catch((error) => {
              resolve({
                log: sensorId + ': Failed to remove previous observations',
              });
            });
          } else {
            resolve({
              success: sensorId + ': Data for ' + name + ' stored '
              + '(dataId: ' + dataId + ')',
            });
          }
        }
      })
      .catch((error) => reject(error));
    });
  }
}
