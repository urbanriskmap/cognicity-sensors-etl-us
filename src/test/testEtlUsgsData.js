import * as test from 'unit.js';
import {handler} from '../functions/etl-data/usgs/index';
// import etl from '../functions/etl-data/usgs/model';

export default () => {
  describe('Extract, transform & load usgs sensor data', () => {
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
