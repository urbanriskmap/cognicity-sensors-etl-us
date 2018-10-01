import EtlData from '../../../services/data/etl.data';

export default class {
  constructor(config) {
    this.config = config;
    this.config.API_ENDPOINT = config.NOAA_ENDPOINT;

    let dataStructureKeys;
    if (this.config.DATA_TYPE === 'water_level') {
      dataStructureKeys = ['data', 'length'];
    } else if (this.config.DATA_TYPE === 'predictions') {
      dataStructureKeys = ['predictions', 'length'];
    }

    this.sensorParameters = {
      // Refer services/utility.filterChecks method
      filterConditions: [
        {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
      ],

      // Refer services/utility.extractChecks method
      dataStructureKeys: dataStructureKeys,

      // Add nested property key for properties.observations
      // in sensors.data table; else keep null or ''
      childProperty: '',
    };

    this.utilityMethods = {
      // Refer services/extract method
      getSensorQuerySets: (sensor) => {
        const period = this.getQueryTimeFormat();
        let beginDate;
        let endDate;
        if (this.config.DATA_TYPE === 'water_level') {
          beginDate = period.begin;
          endDate = period.now;
        } else if (this.config.DATA_TYPE === 'predictions') {
          beginDate = period.begin;
          endDate = period.end;
        }

        return [
          {station: sensor[this.config.SENSOR_UID_PROPERTY]},
          {product: this.config.DATA_TYPE},
          {begin_date: beginDate},
          {end_date: endDate},
          {datum: sensor.datum},
          {time_zone: sensor.time_zone},
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
        let sensorData;
        let observations;
        let transformedData;
        if (this.config.DATA_TYPE === 'water_level') {
          sensorData = result.data;
        } else if (this.config.DATA_TYPE === 'predictions') {
          sensorData = result.predictions;
        }

        return new Promise((resolve, reject) => {
          if (sensorData.length
            && sensorData[0].hasOwnProperty('v')
            && sensorData[0].hasOwnProperty('t')
          ) {
            observations = sensorData;
            transformedData = [];
            for (let observation of observations) {
              const dateTime = new Date(observation.t);
              transformedData.push({
                dateTime: dateTime.toISOString(),
                value: observation.v,
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
          log: 'Error connecting NOAA API',
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
      return date.getFullYear().toString()
      + (date.getMonth() < 9
        ? '0' + (date.getMonth() + 1)
        : (date.getMonth() + 1).toString())
      + (date.getDate() < 10
        ? '0' + date.getDate()
        : date.getDate().toString())
      + ' ' + (date.getHours() < 10 // URI encoding in extract service
        ? '0' + date.getHours()
        : date.getHours().toString())
      + ':' + '00'; // URI encoding in extract service
    };

    const recordsPeriodMs = parseInt(
      this.config.RECORDS_PERIOD.slice(1, -1), 10
    ) * 24 * 60 * 60 * 1000; // In days
    const predictPeriodMs = parseInt(
      this.config.NOAA_PREDICTION_PERIOD.slice(2, -1), 10
    ) * 60 * 60 * 1000; // In hours

    const now = new Date();
    const start = new Date(Date.parse(now) - recordsPeriodMs);
    const predict = new Date(Date.parse(now) + predictPeriodMs);

    return {
      begin: formatDateString(start),
      now: formatDateString(now),
      end: formatDateString(predict),
    };
  }
}
