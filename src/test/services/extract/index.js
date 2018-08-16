import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import {extract} from '../../../services/sensors/extract';
import testData from './test-data';

export default () => {
  describe('Test extract service', () => {
    before(() => {
      sinon.stub(request, 'get')
      .onFirstCall()
        .yields(null, null, {args: request.get.args})
      .onSecondCall()
        .yields(null, null, {
          propertyA: {
            propertyB: [
              {
                propertyC: 'foo',
              },
            ],
          },
        })
      .onThirdCall()
        .yields(null, null, {
          propertyA: {
            propertyC: 'foo',
          },
        })
      .onCall(3)
        .yields({message: 'API endpoint or connection error'});
    });

    after(() => {
      request.get.restore();
    });

    it('Parses URL correctly', (done) => {
      test.promise
      .given(extract(testData.baseUrl, testData.querySet_1, []))
      .then((body) => {
        const queriedUrl = body.args[0][0].url;
        test.value(queriedUrl).is(
          'https://some.base.url/?firstParam=1&secondParam=2&thirdParam=3'
        );
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Successfully checks for nested properties', (done) => {
      const conditions = ['propertyA', 'propertyB', '0', 'propertyC'];
      test.promise
      .given(extract(testData.baseUrl, testData.querySet_2, conditions))
      .then((body) => {
        test.value(
          body.propertyA.propertyB[0].propertyC
        ).is('foo');
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Resolves with a log for format mismatch', (done) => {
      const conditions = ['propertyA', 'propertyB'];
      test.promise
      .given(extract(testData.baseUrl, testData.querySet_2, conditions))
      .then((body) => {
        test.value(body.log)
        .is('Error fetching sensors, or incompatible format');
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(extract(testData.baseUrl, testData.querySet_3, []))
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
