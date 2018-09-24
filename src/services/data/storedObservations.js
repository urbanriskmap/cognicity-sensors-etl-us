import request from 'request';

export default (endpoint, id, dataType) => {
  return new Promise((resolve, reject) => {
    let queryUrl = endpoint + id;

    queryUrl += dataType ? '?type=' + dataType : '';

    request.get({
      url: queryUrl,
      json: true,
    }, (error, response, body) => {
      if (error) reject(error);

      let storedObservations;
      let storedObsCheckPassed = false;
      let dataId;
      let latestRow;

      if (body.result && body.result.length) {
        latestRow = body.result[body.result.length - 1];
      }

      if (latestRow
        && latestRow.hasOwnProperty('properties')
        && latestRow.properties
        && latestRow.properties.hasOwnProperty('observations')
      ) {
        storedObsCheckPassed = true;
        storedObservations = latestRow.properties.observations;
        dataId = latestRow.dataId;
      }

      resolve({
        checksPassed: storedObsCheckPassed,
        storedObservations: storedObservations,
        dataId: dataId,
      });
    });
  });
};
