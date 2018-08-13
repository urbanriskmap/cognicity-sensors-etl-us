import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import Service from '../../services/http.service';
import testData from './test-data';
import testConfig from '../test-config';

export default () => {
  describe('Test services', () => {
    let service;
    before(() => {
      service = new Service(testConfig);

      sinon.stub(request, 'get')
        .yields(null, null, testData.getSensors())
      .withArgs({
        url: 'someEndpoint/sensorId',
        json: true,
      })
        .yields({message: 'Get sensors error'}, null, null);

      sinon.stub(request, 'post')
        .yields(null, null, testData.postSensors())
      .withArgs({
        url: 'someEndpoint/sensorId',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
        json: {},
      })
        .yields({message: 'Post sensors error'}, null, null);

      sinon.stub(request, 'delete')
      .withArgs({
        url: 'someEndpoint/1/2',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
      })
        .yields(null, null, {statusCode: 200, body: []})
      .withArgs({
        url: 'someEndpoint/3/4',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'someApiKey',
        },
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
      .given(service.getSensors('usgs'))
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
          .value(body.result.id)
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
