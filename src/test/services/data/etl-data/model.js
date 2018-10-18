import EtlData from '../../../../services/data/etl.data';

export default class {
  constructor(config) {
    this.config = config;
    this.config.API_ENDPOINT = config.AGENCY_API;

    this.sensorParameters = {
      filterConditions: [],
      dataStructureKeys: [],
      childProperty: '',
    };

    this.utilityMethods = {
      getSensorQuerySets: (sensor) => {
        return [
          {station: sensor[this.config.SENSOR_UID_PROPERTY]},
          {period: this.config.RECORDS_PERIOD},
        ];
      },

      parseStoredData: (obs) => {
        let lastUpdated;
        let isInitializing;

        if (obs) {
          if (obs.length
          && obs[obs.length - 1].hasOwnProperty('dateTime')) {
            lastUpdated = obs[obs.length - 1].dateTime;
          }
        } else {
          isInitializing = true;
        }

        return {
          lastUpdated: lastUpdated,
          initializing: isInitializing,
        };
      },

      transform: (sensor, result) => {
        const sensorData = result.observations;
        let observations;
        let transformedData;

        return new Promise((resolve, reject) => {
          if (sensorData.length
            && sensorData[0].hasOwnProperty('measurement')
            && sensorData[0].hasOwnProperty('timestamp')
          ) {
            observations = sensorData;
            transformedData = [];
            for (let ob of observations) {
              transformedData.push({
                dateTime: ob.timestamp,
                value: ob.measurement,
              });
            }

            resolve(transformedData);
          } else {
            reject({
              log: sensor.id + ': No valid data available',
            });
          }
        });
      },
    };

    this.logMessages = {
      noSensors: 'No sensors found matching the given conditions',
      notUpdated: (id) => id + ': No new data available',
      serverError: (err) => {
        return {
          log: 'Error connecting congnicity sensors API',
          error: JSON.stringify(err),
        };
      },
      sensorError: (id, err) => {
        return {
          log: 'Error retrieving data from congnicity API for sensor id: ' + id,
          error: JSON.stringify(err),
        };
      },
      apiError: (querySets, err) => {
        return {
          log: 'Error connecting Agency API',
          queryParameters: JSON.stringify(querySets),
          error: JSON.stringify(err),
        };
      },
      apiErrorNonFatal: (querySets, err) => {
        return {
          log: 'No data, or incongruent format',
          queryParameters: JSON.stringify(querySets),
          error: JSON.stringify(err),
        };
      },
      deleteError: (id, dataId, err) => {
        return {
          log: 'Failed to remove previous observations for sensor id: ' + id
          + ', data id: ' + dataId,
          error: JSON.stringify(err),
        };
      },
      dataStored: (id, dataId) => {
        return {
          success: 'Data stored. Sensor ID: ' + id
          + ', Data ID: ' + dataId,
        };
      },
      dataUpdated: (id, dataId) => {
        return {
          success: 'Data updated. Sensor ID: ' + id
          + ', Data ID: ' + dataId,
        };
      },
    };

    this.process = new EtlData(
      this.config,
      this.sensorParameters,
      this.utilityMethods,
      this.logMessages
    );
  }
}
