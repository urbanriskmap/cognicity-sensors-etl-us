import * as test from 'unit.js';
import {handler} from '../functions/etl-sensors/usgs/index';

export default () => {
  describe('Extract, transform & load usgs sensors handler testing', () => {
    it('Runs', (done) => {
      let event = {};
      let context = {};
      handler(event, context, (error, response) => {
        test.value(response).is('ETL process complete');
      });
      done();
    });
  });
};
