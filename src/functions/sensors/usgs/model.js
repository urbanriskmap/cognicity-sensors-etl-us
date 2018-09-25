import _extract from '../../../services/extract';
import _filter from '../../../services/filter';
import _compare from '../../../services/sensors/compare';
import _load from '../../../services/load';

export default class {
  constructor(config) {
    this.config = config;
  }

  transform(sensor) {
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

    // NOTE: change according to sensor data format
    const querySets = [
      {countyCd: this.config.USGS_COUNTY_CODE},
      {parameterCd: this.config.SENSOR_CODE},
      {siteStatus: this.config.USGS_SITE_STATUS},
    ];

    return new Promise((_resolve, _reject) => {
      // Extract sensors from USGS API
      // NOTE: change parameters according to sensor format
      // as received from API
      _extract(
        this.config.USGS_BASE_URL,
        querySets,
        ['value', 'timeSeries', 'length'] // Properties to check for
      )
      .then((body) => {
        // Fetch and store a list of existing sensor uniqueId's
        let existingSensorUids = [];
        _filter(
          this.config.SERVER_ENDPOINT,
          conditions,
          this.config.SENSOR_AGENCY
        )
        .then((existingSensors) => {
          for (const existingSensor of existingSensors) {
            existingSensorUids.push(
              existingSensor[this.config.SENSOR_UID_PROPERTY]
            );
          }

          // Store extracted sensors
          // NOTE: change value according to
          // sensor format as retrieved from API
          const extractedSensors = body.value.timeSeries;

          // Iterate over extracted sensors
          for (const sensorToTransform of extractedSensors) {
            // Transform sensor to match CogniCity sensors metadata format
            const sensorToCompare = this.transform(sensorToTransform);

            etlProcesses.push(
              new Promise((resolve, reject) => {
                // Check if sensor already exists in database
                _compare(
                  sensorToCompare,
                  this.config.SENSOR_UID_PROPERTY,
                  existingSensorUids
                )
                .then((metadata) => {
                  if (metadata.hasOwnProperty('log')) {
                    // Log: Sensor already exists
                    resolve(metadata.log);
                  }

                  // Load sensor metadata to database
                  _load(
                    this.config.SERVER_ENDPOINT,
                    this.config.API_KEY,
                    metadata
                  )
                  .then((result) => {
                    if (result.hasOwnProperty('success')) {
                      resolve(result);
                    }

                    // Log: Error uploading sensor,
                    // continue with remaining sensors
                    resolve('Unknown error while loading sensor');
                  })
                  .catch((error) => {
                    // Fatal: Unexpected promise failure from _load service
                    reject(error.log);
                  });
                })
                .catch((error) => {
                  // Fatal: Unexpected promise failure from _compare service
                  reject(error);
                });
              })
            );
          }

          // Return list of promises with either 'log' or 'success' message
          _resolve(etlProcesses);
        })
        .catch((error) => {
          // Fatal: Failed to receive response from sensors endpoint
          _reject(error);
        });
      })
      .catch((error) => {
        // Fatal: Failed to extract sensors from USGS API
        _reject(error);
      });
    });
  }
}
