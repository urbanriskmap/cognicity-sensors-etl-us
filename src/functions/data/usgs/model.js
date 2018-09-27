import EtlData from '../../../services/data/etl.data';

export default class {
  constructor(config) {
    this.config = config;
    this.config.API_ENDPOINT = config.USGS_BASE_URL;

    this.sensorParameters = {
      // Refer services/utility.filterChecks method
      filterConditions: [
        {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
        {type: 'hasProperty', values: ['class']},
        {type: 'equate', values: [
          {type: 'property', value: 'class'},
          {type: 'value', value: this.config.USGS_SENSOR_CODE},
        ]},
      ],

      // Refer services/utility.extractChecks method
      dataStructureKeys: ['value', 'timeSeries', 'length'],

      // Add nested property key for properties.observations
      // in sensors.data table; else keep null or ''
      // NOTE: config variables from process.env are strings
      childProperty: this.config.SENSOR_CHILD_PROPERTY === 'true'
      ? 'upstream' : '',
    };

    this.utilityMethods = {
      // Refer services/extract method
      getSensorQuerySets: (sensor) => {
        return [
          {sites: sensor[this.config.SENSOR_UID_PROPERTY]},
          {period: this.config.RECORDS_PERIOD},
        ];
      },

      parseStoredData: (obs) => {
        let lastUpdated;
        let isInitializing;

        if (obs) {
          // process.env passes true / false values as strings
          if (this.config.SENSOR_CHILD_PROPERTY === 'true'
            && obs.upstream.length
            && obs.upstream[obs.upstream.length - 1].hasOwnProperty('dateTime')
          ) {
            lastUpdated = obs.upstream[obs.upstream.length - 1].dateTime;
          } else if (this.config.SENSOR_CHILD_PROPERTY === 'false'
            && obs.length
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
        // NOTE: modify sensorData value according to
        // JSON format as retrieved from agency API
        const sensorData = result.value.timeSeries;
        let observations;
        let transformedData;

        return new Promise((resolve, reject) => {
          if (sensorData.length
            && sensorData[0].hasOwnProperty('values')
            && sensorData[0].values.length
            && sensorData[0].values[0].hasOwnProperty('value')
          ) {
            if (this.config.SENSOR_CHILD_PROPERTY === 'true') {
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
          log: 'Error connecting USGS API',
          queryParameters: JSON.stringify(querySets),
          error: JSON.stringify(err),
        };
      },
      deleteError: (id, err) => {
        return {
          log: 'Failed to remove previous observations for sensor id: ' + id,
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
