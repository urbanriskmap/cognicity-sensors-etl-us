import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import load from '../../../services/sensors/load';
import testData from './test-data';

export default () => {
  describe('Test extract service', () => {
    before(() => {
      sinon.stub(request, 'post')
      .onFirstCall()
        .yields(null, null, testData.successResponse())
      .onSecondCall()
        .yields(null, null, testData.errorResponse())
      .onThirdCall()
        .yields(null, null, testData.noIdResponse())
      .onCall(3)
        .yields('Sensor upload failed due to server error');
    });

    after(() => {
      request.post.restore();
    });

    it('Skips upload if object has a log message', (done) => {
      test.promise
      .given(load(testData.baseUrl, testData.apiKey, {log: 'Previous log'}))
      .then((result) => {
        request.post.called.should.be.equal(false);
        test.value(result.log).is('Previous log');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves with success message and id value', (done) => {
      test.promise
      .given(load(testData.baseUrl, testData.apiKey, testData.sensorMetadata))
      .then((result) => {
        test.value(result.success)
        .is('56: Success adding sensor');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // noId...
    it('Resolves with log message if upload fails with known error', (done) => {
      test.promise
      .given(load(testData.baseUrl, testData.apiKey, {foo: 'bar'}))
      .then((result) => {
        test.value(result.log)
        .is({
          statusCode: 400,
          result: 'Incompatible sensor format',
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves with log message if response format is incorrect', (done) => {
      test.promise
      .given(load(testData.baseUrl, testData.apiKey, {foo: 'bar'}))
      .then((result) => {
        test.value(
          result.log.result.features[0].properties.hasOwnProperty('id')
        ).is(false);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Resolves with error message as log if upload fails', (done) => {
      test.promise
      .given(load(testData.baseUrl, testData.apiKey, {foo: 'bar'}))
      .then((error) => {
        test.value(error.log)
        .is('Sensor upload failed due to server error');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });
  });
};
