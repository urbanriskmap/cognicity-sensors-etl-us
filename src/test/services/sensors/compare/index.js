import * as test from 'unit.js';

import compare from '../../../../services/sensors/compare';

export default () => {
  describe('Test compare sensors service', () => {
    const sensorToCompare = {
      properties: {
        uniqueIdKey: 'testUniqueId',
        foo: 'bar',
      },
    };

    it('Skips comparison if Uid list is empty', (done) => {
      test.promise
      .given(compare(sensorToCompare, 'uniqueIdKey', []))
      .then((sensor) => {
        test.value(sensor.properties.foo).is('bar');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns sensor if Uid doesn\'t exist in list', (done) => {
      test.promise
      .given(compare(sensorToCompare, 'uniqueIdKey', [
        'firstUniqueId',
        'secondUniqueId',
        'thirdUniqueId',
      ]))
      .then((sensor) => {
        test.value(sensor.properties.foo).is('bar');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves with a log if sensor exists', (done) => {
      test.promise
      .given(compare(sensorToCompare, 'uniqueIdKey', [
        'someUniqueId',
        'testUniqueId',
        'otherUniqueId',
      ]))
      .then((result) => {
        test.value(result)
        .is({log: 'testUniqueId'});
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });
  });
};
