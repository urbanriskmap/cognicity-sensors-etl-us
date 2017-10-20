import * as test from 'unit.js';
import sinon from 'sinon';
import services from '../../services';
import testData from './test-data';
import request from 'request';
import config from '../../config';

export default () => {
  describe('Test services', () => {
    before(() => {
      sinon.stub(config, 'SERVER_ENDPOINT')
        .value('someEndpoint');

      sinon.stub(config, 'API_KEY')
        .value('someApiKey');

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
      // config.restore();
    });

    it('Gets sensors', (done) => {
      test.promise
      .given(services.getSensors(null, config))
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
      .given(services.getSensors('sensorId', config))
      .then()
      .catch((error) => {
        test.value(error).is(new Error('Get sensors error'));
      })
      .finally(done)
      .done();
    });

    it('Posts sensors', (done) => {
      test.promise
      .given(services.postSensors(5, {}, config))
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
      .given(services.postSensors('sensorId', {}, config))
      .then()
      .catch((error) => {
        test.value(error).is(new Error('Post sensors error'));
      })
      .finally(done)
      .done();
    });
  });
};
