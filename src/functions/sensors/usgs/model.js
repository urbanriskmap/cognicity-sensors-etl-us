import EtlSensors from '../../../services/sensors/etl.sensors';

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
          {type: 'value', value: this.config.SENSOR_CODE},
        ]},
      ],

      // Refer services/utility.extractChecks method
      dataStructureKeys: ['value', 'timeSeries', 'length'],

      // Refer services/extract method
      querySets: [
        {countyCd: this.config.USGS_COUNTY_CODE},
        {parameterCd: this.config.SENSOR_CODE},
        {siteStatus: this.config.USGS_SITE_STATUS},
      ],
    };

    this.utilityMethods = {
      transform: (sensor) => {
        const uid = sensor.sourceInfo.siteCode[0].value;
        const units = sensor.variable.unit.unitCode;

        let sensorType;
        for (let property of sensor.sourceInfo.siteProperty) {
          if (property.name === 'siteTypeCd') {
            sensorType = property.value;
          }
        }

        return {
          properties: {
            uid: uid,
            agency: this.config.SENSOR_AGENCY,
            type: sensorType,
            class: this.config.SENSOR_CODE,
            units: units,
          },
          location: {
            lat: sensor.sourceInfo.geoLocation.geogLocation.latitude,
            lng: sensor.sourceInfo.geoLocation.geogLocation.longitude,
          },
        };
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
          log: 'Error connecting USGS API',
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
