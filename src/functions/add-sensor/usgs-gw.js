const request = require('request');

require('dotenv').config({silent: true});

exports.addGWSensor = (event, context, callback) => {
  let metadataInDB = [];
  let newSensorMetadata;
  let sensorCount = 0;
  // TODO: add filter parameters in cognicity-sensors get sensors function ?
  // to filter sensors in metadata table by optional key:value pair
  // in properties (jsonb) column
  request
  .get('https://ckf6kf5dvd.execute-api.us-west-2.amazonaws.com/dev/sensors/')
  .on('error', (error) => {
    console.error(error);
  })
  .on('response', (response) => {
    // store uid's from sensors metadata
    for (let sensor of response.body.features) {
      if (sensor.properties.properties.hasOwnProperty('uid')) {
        metadataInDB.push(sensor.properties.properties.uid);
      }
    }
    request
    .get('https://waterservices.usgs.gov/nwis/iv/?format=json&countyCd=12011&parameterCd=62610&siteStatus=all')
    .on('error', (error) => {
      console.error(error);
    })
    .on('response', (resp) => {
      for (let sensor of resp.value.timeSeries) {
        let compareCount = 0;
        for (let uid of metadataInDB) {
          if (sensor.sourceInfo.siteCode[0].value === uid) {
            compareCount += 1;
            break;
          }
        }
        if (compareCount === 0) {
          let sensorType;
          let uid = sensor.sourceInfo.siteCode[0].value;
          for (let property of sensor.sourceInfo.siteProperty) {
            if (property.name === 'siteTypeCd') {
              sensorType = property.value;
            }
          }
          newSensorMetadata = {
            uid: uid,
            type: sensorType,
            geoLocation: sensor.sourceInfo.geoLocation.geogLocation,
            query_parameters: {
              cb_62610: 'on',
              format: 'rdb',
              site_no: uid,
              period: 2,
            },
          };
          request
          .post({
            url: 'https://ckf6kf5dvd.execute-api.us-west-2.amazonaws.com/dev/sensors/',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.API_KEY,
            },
          }, newSensorMetadata);
          sensorCount += 1;
        }
      }
      console.log(sensorCount +
      ((sensorCount === 0 || sensorCount === 1) ? ' sensor' : ' sensors') +
      ' added');
    });
  });
};
