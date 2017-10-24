import * as test from 'unit.js';
import sinon from 'sinon';
import {Service} from '../../services';
import testData from './test-data';
import request from 'request';
import testConfig from '../test-config';

export default () => {
  describe('Test services', () => {
    let service;
    before(() => {
      service = new Service(testConfig);

      sinon.stub(request, 'get')
      .yields(null, null, testData.getSensors())
      .withArgs({
        url: 'someEndpointsensorId',
        json: true,
      })
      .yields(testData.getSensorsError(), null, null);

      sinon.stub(request, 'post')
      .yields(null, null, testData.postSensors())
      .withArgs({
        url: 'someEndpointsensorId',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
        json: {},
      })
      .yields(testData.postSensorsError(), null, null);
    });

    after(() => {
      request.get.restore();
      request.post.restore();
    });

    it('Gets sensors', (done) => {
      test.promise
      .given(service.getSensors(null))
      .then((body) => {
        request.get.called.should.be.equal(true);
        test
          .value(body.body.features[0].properties.properties.uid)
          .is('uniqueId');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches get sensors error', (done) => {
      test.promise
      .given(service.getSensors('sensorId'))
      .then()
      .catch((error) => {
        test.value(error).is(new Error('Get sensors error'));
      })
      .finally(done)
      .done();
    });

    it('Posts sensors', (done) => {
      test.promise
      .given(service.postSensors(5, {}))
      .then((body) => {
        request.get.called.should.be.equal(true);
        test
          .value(body.body.features[0].properties.id)
          .is(5);
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches post sensors error', (done) => {
      test.promise
      .given(service.postSensors('sensorId', {}))
      .then()
      .catch((error) => {
        test.value(error).is(new Error('Post sensors error'));
      })
      .finally(done)
      .done();
    });
  });
};
