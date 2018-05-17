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
      .yields({message: 'Get sensors error'}, null, null);

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
      .yields({message: 'Post sensors error'}, null, null);

      sinon.stub(request, 'delete')
      .withArgs({
        url: 'someEndpoint1',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
        json: {data_id: 2},
      })
      .yields(null, null, {
        statusCode: 200,
        body: [],
      })
      .withArgs({
        url: 'someEndpoint3',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
        json: {data_id: 4},
      })
      .yields({message: 'Delete error'}, null, null);
    });

    after(() => {
      request.get.restore();
      request.post.restore();
      request.delete.restore();
    });

    it('Gets sensors', (done) => {
      test.promise
      .given(service.getSensors(null))
      .then((body) => {
        request.get.called.should.be.equal(true);
        test
          .value(body.result.features[0].properties.properties.uid)
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
        test.value(error.message).is('Get sensors error');
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
          .value(body.result.features[0].properties.id)
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
        test.value(error.message).is('Post sensors error');
      })
      .finally(done)
      .done();
    });

    it('Deletes sensor data row', (done) => {
      test.promise
      .given(service.deleteObservations(1, 2))
      .then((body) => {
        request.delete.called.should.be.equal(true);
        test.value(body.statusCode).is(200);
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches delete data error', (done) => {
      test.promise
      .given(service.deleteObservations(3, 4))
      .then()
      .catch((error) => {
        test.value(error.message).is('Delete error');
      })
      .finally(done)
      .done();
    });
  });
};
