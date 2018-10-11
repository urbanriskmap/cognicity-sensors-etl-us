import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import extract from '../../../services/extract';
import testData from './test-data';

export default () => {
  describe('Test extract service', () => {
    before(() => {
      sinon.stub(request, 'get')
        .onFirstCall()
        .yields(null, null, {args: request.get.args})
        // Second call
        .withArgs({
          url: 'https://second.base.url/?firstParam=1&secondParam=2&thirdParam=3',
          json: true,
        })
        .yields({message: 'API endpoint or connection error'})
        // Third call
        .withArgs({
          url: 'https://third.base.url/?firstParam=1&fourthParam=4&fifthParam=5',
          json: true,
        })
        .yields(null, null, {
          propertyA: {
            propertyB: [
              {
                propertyC: 'foo',
              },
            ],
          },
        })
        // Fourth call
        .withArgs({
          url: 'https://fourth.base.url/?firstParam=1&sixthParam=6&seventhParam=7',
          json: true,
        })
        .yields(null, null, {
          propertyA: {
            propertyC: 'Error fetching sensors, or incompatible format',
          },
        });
    });

    it('Parses URL correctly', (done) => {
      test.promise
      .given(extract(testData.baseUrl_1, testData.querySet_1, []))
      .then((body) => {
        const queriedUrl = body.args[0][0].url;
        test.value(queriedUrl).is(
          'https://first.base.url/?firstParam=1&secondParam=2&thirdParam=3'
        );
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(extract(testData.baseUrl_2, testData.querySet_1, []))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.message)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });

    it('Successfully checks for nested properties', (done) => {
      const conditions = ['propertyA', 'propertyB', '0', 'propertyC'];
      test.promise
      .given(extract(testData.baseUrl_3, testData.querySet_2, conditions))
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
      .given(extract(testData.baseUrl_4, testData.querySet_3, conditions))
      .then((body) => {
        test.value(body.log.propertyA.propertyC)
        .is('Error fetching sensors, or incompatible format');
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });

    after(() => {
      request.get.restore();
    });
  });
};
