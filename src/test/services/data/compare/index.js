import * as test from 'unit.js';

import compare from '../../../../services/data/compare';
import testData from './test-data';

export default () => {
  describe('Test compare data service', () => {
    it('Skips comparison if no previous data exists', (done) => {
      test.promise
      .given(compare('', [], '', true))
      .then(({exit}) => {
        test.value(exit).is(false);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Skips comparison & exits if no data object provided', (done) => {
      test.promise
      .given(compare('', undefined, '', false))
      .then(({exit}) => {
        test.value(exit).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves true if data cannot be compared - 1', (done) => {
      test.promise
      .given(compare('upstream', testData.mockData_1, '', false))
      .then(({exit}) => {
        test.value(exit).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves true if data cannot be compared - 2', (done) => {
      test.promise
      .given(compare(null, testData.mockData_2, '', false))
      .then(({exit}) => {
        test.value(exit).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves true if data not updated - 1', (done) => {
      const lastUpdated = '2018-10-14T14:00:00.000Z';

      test.promise
      .given(compare('upstream', testData.mockData_3, lastUpdated, false))
      .then(({exit}) => {
        test.value(exit).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves true if data not updated - 2', (done) => {
      const lastUpdated = '2018-10-14T14:00:00.000Z';

      test.promise
      .given(compare(null, testData.mockData_4, lastUpdated, false))
      .then(({exit}) => {
        test.value(exit).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves false if new data is available - 1', (done) => {
      const lastUpdated = '2018-10-14T11:00:00.000Z';

      test.promise
      .given(compare('upstream', testData.mockData_3, lastUpdated, false))
      .then(({exit}) => {
        test.value(exit).is(false);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves false if new data is available - 2', (done) => {
      const lastUpdated = '2018-10-14T11:00:00.000Z';

      test.promise
      .given(compare(null, testData.mockData_4, lastUpdated, false))
      .then(({exit}) => {
        test.value(exit).is(false);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });
  });
};
