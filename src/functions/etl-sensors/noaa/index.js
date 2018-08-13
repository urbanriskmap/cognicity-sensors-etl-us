import stations from './stations';
import {UploadStations} from './model';
import config from '../../../config';

exports.handler = (event, context, callback) => {
  const upload = new UploadStations(config);
  let processStations = [];
  let uploadCount = 0;

  upload.getExistingStations()
  .then((existingStationIds) => {
    for (let station of stations.metadata) {
      processStations.push(
        new Promise((resolve, reject) => {
          upload.compareStations(station, existingStationIds)
          .then((metadata) => {
            upload.loadStation(metadata)
            .then((result) => {
              if (result.hasOwnProperty('log')) {
                console.log(result.log);
                resolve(result.log);
              } else if (result.hasOwnProperty('success')) {
                console.log(result.success);
                uploadCount += 1;
                resolve(result.success);
              }
            })
            .catch((error) => reject(error));
          })
          .catch((error) => reject(error));
        })
      );
    }
  })
  .catch((error) => callback(error));

  Promise.all(processStations)
  .then((messages) => {
    let result = {
      sensors_updated: uploadCount,
      logs: messages,
    };
    callback(null, result);
  })
  .catch((error) => callback(error));
};
