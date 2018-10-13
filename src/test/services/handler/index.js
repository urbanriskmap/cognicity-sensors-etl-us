import * as test from 'unit.js';
import sinon from 'sinon';

import handler from '../../../services/handler.service';
import testData from './test-data';

export default () => {
  describe('Test handler service', () => {
    const callback = (error, logs) => {};
    let spyOnCallback;

    beforeEach(() => {
      // Set spy on callback before each test
      spyOnCallback = sinon.spy(callback);
    });

    const msg = 'Sensors added: ';

    it('Catches and prints errors in ETL process', (done) => {
      test.promise
      .given(handler(testData.processError, spyOnCallback, ''))
      .then(() => {
        test.value(spyOnCallback.calledOnce).is(true);
        test.value(JSON.parse(spyOnCallback.args[0][0]))
        .is({
          log: '2: Agency API error',
          error: {
            statusCode: 404,
            message: 'URL not found',
          },
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Counts and prints success logs', (done) => {
      // Silence console output
      sinon.stub(console, 'log');

      test.promise
      .given(handler(testData.success, spyOnCallback, msg))
      .then(() => {
        test.value(spyOnCallback.calledOnce).is(true);
        test.value(spyOnCallback.args[0][1])
        .is('Sensors added: 3');

        console.log.restore();
      })
      .catch((error) => {
        console.log.restore();

        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Catches fatal errors and passes them to callback', (done) => {
      test.promise
      .given(handler(testData.executionError, spyOnCallback, ''))
      .then(() => {
        test.value(spyOnCallback.calledOnce).is(true);
        test.value(spyOnCallback.args[0][0])
        .is('Fatal error');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });
  });
};
