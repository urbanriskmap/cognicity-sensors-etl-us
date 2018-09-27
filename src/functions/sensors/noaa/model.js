import EtlSensors from '../../../services/sensors/etl.sensors';
import stations from './stations';

export default class {
  constructor(config) {
    this.config = config;

    this.sensorParameters = {
      // Refer services/utility.filterChecks method
      filterConditions: [
        {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
      ],

      // Refer services/utility.extractChecks method
      dataStructureKeys: [],

      list: stations.metadata,
    };

    this.logMessages = {
      noSensors: 'Error in stations list',
      compareError: 'Unknown error, failed to compare stations',
      sensorExists: (id) => 'Station already stored. Id: ' + id,
      sensorLoaded: (id) => {
        return {
          success: 'Station stored. Id: ' + id,
        };
      },
      serverError: (err) => {
        return {
          log: 'Error connecting congnicity sensors API',
          error: JSON.stringify(err),
        };
      },
    };

    this.process = new EtlSensors(
      this.config,
      this.sensorParameters,
      null,
      this.logMessages
    );
  }
}
