import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import load from '../../../services/load';
import testData from './test-data';

export default () => {
  describe('Test load service', () => {
    const getRequestOptions = (apiKey, id) => {
      return {
        url: testData.baseUrl + id,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        json: {foo: 'bar'},
      };
    };

    before(() => {
      sinon.stub(request, 'post')
      .onFirstCall()
        .yields(request.post.args)
      .withArgs(getRequestOptions('apiKey_1', 1))
        .yields('API endpoint or connection error')
      .withArgs(getRequestOptions('apiKey_1', 2))
        .yields(null, null, {statusCode: 400})
      .withArgs(getRequestOptions('apiKey_2', ''))
        .yields(null, null, testData.mockResponse_1)
      .withArgs(getRequestOptions('apiKey_2', 3))
        .yields(null, null, testData.mockResponse_2)
      .withArgs(getRequestOptions('apiKey_3', ''))
        .yields(null, null, testData.mockResponse_3)
      .withArgs(getRequestOptions('apiKey_3', 4))
        .yields(null, null, testData.mockResponse_3);
    });

    it('Parses URL correctly', (done) => {
      test.promise
      .given(load(testData.baseUrl, '', {}))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch(({log}) => {
        test.value(log[0][0]['url'])
        .is('https://some.base.url/');
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_1',
        {foo: 'bar'},
        1
      ))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.log)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if statusCode not equal to 200', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_1',
        {foo: 'bar'},
        2
      ))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.log.statusCode)
        .is(400);
      })
      .finally(done)
      .done();
    });

    it('Resolves with id of new sensor created', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_2',
        {foo: 'bar'}
      ))
      .then((result) => {
        test.value(result.id).is(5);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves with id of new data row created for sensor', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_2',
        {foo: 'bar'},
        3
      ))
      .then((result) => {
        test.value(result.newDataId).is(500);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Rejects with log if sensor response format is incompatible', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_3',
        {foo: 'bar'}
      ))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((body) => {
        test.value(body.log.result).is('Incompatible format');
      })
      .finally(done)
      .done();
    });

    it('Rejects with log if data response format is incompatible', (done) => {
      test.promise
      .given(load(
        testData.baseUrl,
        'apiKey_3',
        {foo: 'bar'},
        4
      ))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((body) => {
        test.value(body.log.result).is('Incompatible format');
      })
      .finally(done)
      .done();
    });

    after(() => {
      request.post.restore();
    });
  });
};
