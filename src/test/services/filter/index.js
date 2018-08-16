import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import {filter} from '../../../services/sensors/filter';
import testData from './test-data';

export default () => {
  describe('Test filter service', () => {
    before(() => {
      sinon.stub(request, 'get')
      .onFirstCall()
        .yields(null, null, {})
      .onSecondCall()
        .yields(null, null, {})
      .onThirdCall()
        .yields(null, null, {})
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_5',
        json: true,
      })
        .yields({message: 'API endpoint or connection error'});
    });

    after(() => {
      request.get.restore();
    });

    it('', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency'))
      .then((body) => {

      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency'))
      .then((body) => {

      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency'))
      .then((body) => {
        //
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency'))
      .then((body) => {
        //
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency_5'))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.message)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });
  });
};
