import * as test from 'unit.js';
import {handler} from '../functions/etl-sensors/usgs/index';
// import etl from '../functions/etl-sensors/usgs/model';

export default () => {
  describe('Extract, transform & load usgs sensors', () => {
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
        test.value(response.sensors_updated).is(26);
      })
      .catch((error) => {
        test.fail(error);
        done(error);
      })
      .done();
    });
    // it('Returns empty array, when no sensors available', (done) => {
    //   //
    //   done();
    // });
    // it('Filters sensors metadata', (done) => {
    //   //
    //   done();
    // });
    // it('Extracts sensor data from USGS', (done) => {
    //   //
    //   done();
    // });
    // it('Compares existing & extracted sensors', (done) => {
    //   //
    //   done();
    // });
    /**
     *
     *
     */
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

    /** Test complete etl process
     *
     *
     */
    // it('Runs', (done) => {
    //   let event = {};
    //   let context = {};
    //   let callback = (error, response) => {
    //     return new Promise(function(resolve, reject) {
    //       if (error) {
    //         reject(error);
    //       } else {
    //         resolve(response);
    //       }
    //     });
    //   };
    //
    //   test.promise
    //   .given(handler(event, context, callback))
    //   .then((response) => {
    //     // test fails here: response is undefined,
    //     // executes before callback in code is resolved
    //     console.log(response);
    //     test.value(response).is('ETL process complete');
    //   })
    //   .catch((error) => {
    //     test.fail(error);
    //     done(error);
    //   })
    //   .done();
    // });
  });
};
