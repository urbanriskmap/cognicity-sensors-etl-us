import EtlSensors from '../../../../services/sensors/etl.sensors';

export default class {
  constructor(config) {
    this.config = config;
    this.config.API_ENDPOINT = config.AGENCY_API;

    this.sensorParameters = {
      filterConditions: [],
      dataStructureKeys: [],
      querySets: undefined,
      list: undefined,
    };

    this.utilityMethods = {
      parseSensors: (response) => {
        return response.sensors;
      },

      transform: (sensor) => {
        return sensor;
      },
    };

    this.logMessages = {
      noSensors: 'No sensors found matching the given conditions',
      compareError: 'Unknown error, failed to compare sensors',
      sensorExists: (id) => 'Sensor already stored, id: ' + id,
      sensorLoaded: (id) => {
        return {
          success: 'Sensor stored. Id: ' + id,
        };
      },
      serverError: (err) => {
        return {
          log: 'Error connecting congnicity sensors API',
          error: JSON.stringify(err),
        };
      },
      apiError: (err) => {
        return {
          log: 'Error connecting Agency API',
          error: JSON.stringify(err),
        };
      },
    };

    this.process = new EtlSensors(
      this.config,
      this.sensorParameters,
      this.utilityMethods,
      this.logMessages
    );
  }
}
