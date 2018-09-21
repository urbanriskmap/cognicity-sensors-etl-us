import {extract as _extract} from '../../../services/sensors/extract';
import {filter as _filter} from '../../../services/sensors/filter';
import _compare from '../../../services/sensors/compare';
import _load from '../../../services/sensors/load';

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
    const conditions = [
      {type: 'hasProperty', values: [this.config.SENSOR_UID_PROPERTY]},
      {type: 'hasProperty', values: ['class']},
      {type: 'equate', values: [
        {type: 'property', value: 'class'},
        {type: 'value', value: this.config.SENSOR_CODE},
      ]},
    ];
    const querySets = [
      {countyCd: this.config.USGS_COUNTY_CODE},
      {parameterCd: this.config.SENSOR_CODE},
      {siteStatus: this.config.USGS_SITE_STATUS},
    ];

    return new Promise((_resolve, _reject) => {
      // Extract sensors from USGS API
      _extract(
        this.config.USGS_BASE_URL,
        querySets,
        ['value', 'timeSeries', 'length'] // Properties to check for
      )
      .then((body) => {
        if (body.hasOwnProperty('log')) {
          // Fatal: Failed to extract sensors from USGS API
          _reject(body.error);
        }

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
                    // Non-fatal: Sensor already exists
                    resolve(metadata.log);
                  }

                  // Load sensor metadata to database
                  _load(
                    this.config.SERVER_ENDPOINT,
                    this.config.API_KEY,
                    metadata
                  )
                  .then((result) => {
                    if (result.hasOwnProperty('log')) {
                      // Non-fatal: Error uploading sensor
                      // Or bubbled up log message; continue iterating
                      resolve(result.log);
                    }

                    if (result.hasOwnProperty('success')) {
                      resolve(result);
                    }

                    // Non-fatal: Error uploading sensor
                    resolve('Unknown error while loading sensor');
                  })
                  .catch((error) => {
                    // Fatal: unexpected promise failure
                    reject(error);
                  });
                })
                .catch((error) => {
                  // Fatal: unexpected promise failure
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
