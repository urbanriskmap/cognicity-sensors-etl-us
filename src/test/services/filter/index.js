import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import filter from '../../../services/filter';
import testData from './test-data';

export default () => {
  describe('Test filter service', () => {
    before(() => {
      sinon.stub(request, 'get')
      .onFirstCall()
        .yields({statusCode: 400, result: request.get.args})
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_1',
        json: true,
      })
        .yields({message: 'API endpoint or connection error'})
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_2',
        json: true,
      })
        .yields(null, null, testData.mockResponse_1)
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_3',
        json: true,
      })
        .yields(null, null, testData.mockResponse_2)
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_4',
        json: true,
      })
        .yields(null, null, testData.mockResponse_3)
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_5',
        json: true,
      })
        .yields(null, null, testData.mockResponse_4)
      .withArgs({
        url: 'https://some.base.url/?agency=someAgency_6',
        json: true,
      })
        .yields(null, null, testData.mockResponse_5);
    });

    it('Parses URL correctly', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], ''))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((body) => {
        const queriedUrl = body.result[0][0]['url'];
        test.value(queriedUrl)
        .is('https://some.base.url/');
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency_1'))
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
      .given(filter(testData.baseUrl, [], 'someAgency_2'))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.result).is(
          'Internal server error'
        );
      })
      .finally(done)
      .done();
    });

    it('Returns empty list if result format is incompatible', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency_3'))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if result has no features', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency_4'))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if feature has no properties', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'someAgency_5'))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Filters sensors based on provided conditions', (done) => {
      test.promise
      .given(filter(
        testData.baseUrl,
        testData.filterConditions,
        'someAgency_6'
      ))
      .then((body) => {
        test.value(body[0].uid).is('260536080302501');
        test.value(body[1]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Skips comparison if condition type is incompatible', (done) => {
      test.promise
      .given(filter(
        testData.baseUrl,
        testData.incompatibleCondition_1,
        'someAgency_6'
      ))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Skips comparison if equate condition type is incompatible', (done) => {
      test.promise
      .given(filter(
        testData.baseUrl,
        testData.incompatibleCondition_2,
        'someAgency_6'
      ))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Skips comparison if equate values not equal to 2', (done) => {
      test.promise
      .given(filter(
        testData.baseUrl,
        testData.incompatibleCondition_3,
        'someAgency_6'
      ))
      .then((body) => {
        test.value(body[0]).is(undefined);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Skips comparison if no conditions provided', (done) => {
      test.promise
      .given(filter(
        testData.baseUrl,
        [],
        'someAgency_6'
      ))
      .then((body) => {
        test.value(body[3].site).is('S39');
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
