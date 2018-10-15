import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import getObs from '../../../../services/data/storedObservations';
import testData from './test-data';

export default () => {
  describe('Test get stored observations service', () => {
    before(() => {
      sinon.stub(request, 'get')
      .withArgs({
        url: 'https://some.base.url/1?type=dataType',
        json: true,
      })
        .yields({statusCode: 400, result: request.get.args})
      .withArgs({
        url: 'https://some.base.url/2',
        json: true,
      })
        .yields({message: 'API endpoint or connection error'})
      .withArgs({
        url: 'https://some.base.url/3',
        json: true,
      })
        .yields(null, null, {statusCode: 400, result: 'Internal server error'})
      .withArgs({
        url: 'https://some.base.url/4',
        json: true,
      })
        .yields(null, null, testData.mockResponse_1)
      .withArgs({
        url: 'https://some.base.url/5',
        json: true,
      })
        .yields(null, null, testData.mockResponse_2)
      .withArgs({
        url: 'https://some.base.url/6',
        json: true,
      })
        .yields(null, null, testData.mockResponse_3);
    });

    it('Parses URL correctly', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 1, 'dataType'))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((body) => {
        const queriedUrl = body.result[0][0]['url'];
        test.value(queriedUrl)
        .is('https://some.base.url/1?type=dataType');
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 2))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.message)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });

    it('Rejects with log if statusCode is not 200', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 3))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.result).is(
          'Internal server error'
        );
      })
      .finally(done)
      .done();
    });

    it('Returns undefined params if result format is incompatible', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 4))
      .then((body) => {
        test.value(body).is({
          checksPassed: false,
          storedObs: undefined,
          lastDataId: undefined,
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns undefined params if data format is incompatible', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 5))
      .then((body) => {
        test.value(body).is({
          checksPassed: false,
          storedObs: undefined,
          lastDataId: undefined,
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns observations and data id if all checks passed', (done) => {
      test.promise
      .given(getObs(testData.baseUrl, 6))
      .then((body) => {
        test.value(body).is({
          checksPassed: true,
          storedObs: [
            {dateTime: '2018-10-14T12:00:00.000Z', value: '1.00'},
            {dateTime: '2018-10-14T11:00:00.000Z', value: '2.00'},
          ],
          lastDataId: 100,
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    after(() => {
      request.get.restore();
    });
  });
};
