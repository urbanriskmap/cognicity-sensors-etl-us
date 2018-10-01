import EtlData from '../../../../services/data/etl.data';

export default class {
  constructor(config) {
    this.config = config;
    this.config.API_ENDPOINT = config.SFWMD_TIMESERIES_ENDPOINT;

    this.sensorParameters = {
      // Refer services/utility.filterChecks method
      filterConditions: [
        {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
      ],

      // Refer services/utility.extractChecks method
      dataStructureKeys: ['timeSeriesResponse', 'timeSeries', 'length'],

      // Add nested property key for properties.observations
      // in sensors.data table; else keep null or ''
      childProperty: '',
    };

    this.utilityMethods = {
      // Refer services/extract method
      getSensorQuerySets: (sensor) => {
        const period = this.getQueryTimeFormat();
        return [
          {names: sensor[this.config.SENSOR_UID_PROPERTY]},
          {beginDateTime: period.begin},
          {endDateTime: period.end},
        ];
      },

      parseStoredData: (obs) => {
        let lastUpdated;
        let isInitializing;

        if (obs) {
          if (obs.length
            && obs[obs.length - 1].hasOwnProperty('dateTime')
          ) {
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
        const sensorData = result.timeSeriesResponse.timeSeries;
        let observations;
        let transformedData;

        return new Promise((resolve, reject) => {
          if (sensorData.length
            && sensorData[0].hasOwnProperty('values')
            && sensorData[0].values.length
            && sensorData[0].values[0].hasOwnProperty('dateTime')
            && sensorData[0].values[0].hasOwnProperty('value')
          ) {
            observations = sensorData[0].values;
            transformedData = [];
            for (let observation of observations) {
              transformedData.push({
                dateTime: observation.dateTime,
                value: observation.value,
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
      noSensors: 'No stations found matching the given conditions',
      notUpdated: (id) => {
        return id + ': Station is inactive or has no new observations';
      },
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
          log: 'Error connecting SFWMD API',
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

  getQueryTimeFormat() {
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
}
