import * as test from 'unit.js';
import {handler} from '../functions/etl-sensors/usgs/index';
// import etl from '../functions/etl-sensors/usgs/model';

export default () => {
  describe('Extract, transform & load usgs sensors handler testing', () => {
    // it('Loads sensor', (done) => {
    //   let sensor = {
    //     sourceInfo: {
    //       siteCode: [
    //         {
    //           value: 'uniqueId',
    //         },
    //       ],
    //       siteProperty: [
    //         {
    //           name: 'siteTypeCd',
    //           value: 'TEST',
    //         },
    //       ],
    //       geoLocation: {
    //         geogLocation: {
    //           latitude: 1,
    //           longitude: 2,
    //         },
    //       },
    //     },
    //     variable: {
    //       unit: {
    //         unitCode: 'units',
    //       },
    //     },
    //   };
    //   test.promise
    //   .given(etl.transformAndLoad(sensor))
    //   .then((sensorId) => {
    //     test.value(sensorId.msg).is('Added sensor with id 39');
    //   })
    //   .catch((error) => {
    //     test.fail(error);
    //     done(error);
    //   })
    //   .done();
    // });
    it('Runs', (done) => {
      let event = {};
      let context = {};
      let callback = (error, response) => {
        return new Promise(function(resolve, reject) {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      };

      test.promise
      .given(handler(event, context, callback))
      .then((response) => {
        // test fails here: response is undefined,
        // executes before callback in code is resolved
        console.log(response);
        test.value(response).is('ETL process complete');
      })
      .catch((error) => {
        test.fail(error);
        done(error);
      })
      .done();
    });
  });
};
