import * as test from 'unit.js';
import sinon from 'sinon';
import request from 'request';
import {Service} from '../../services';
import {EtlSensors} from '../../functions/etl-sensors/usgs/model';
import testData from './test-data';
import testConfig from '../test-config';

export default () => {
  describe('ETL USGS sensors', () => {
    let etl;
    before(() => {
      sinon.stub(EtlSensors.prototype, 'constructor')
      .returns(testConfig);

      etl = new EtlSensors(testConfig);

      sinon.stub(Service.prototype, 'getSensors')
      .onFirstCall()
      .resolves(testData.getSensors())
      .onSecondCall()
      .rejects({message: 'getExistingSensors'});

      let mockUsgsQuery = (sensorCode) => {
        return testConfig.USGS_BASE_URL
        + '&countyCd=' + testConfig.USGS_COUNTY_CODE
        + '&parameterCd=' + sensorCode
        + '&siteStatus=' + testConfig.USGS_SITE_STATUS;
      };

      sinon.stub(request, 'get')
      .withArgs({
        url: mockUsgsQuery(testConfig.SENSOR_CODE),
        json: true,
      })
      .yields(null, null, {
        value: {
          timeSeries: [
            {sensor_id: 1},
            {sensor_id: 2},
          ],
        },
      })
      .withArgs({
        url: mockUsgsQuery('nullCode'),
        json: true,
      })
      .yields(null, null, {
        value: {
          timeSeries: [],
        },
      })
      .withArgs({
        url: mockUsgsQuery('errorCode'),
        json: true,
      })
      .yields({message: 'extractUsgsSensors'}, null, null);

      sinon.stub(Service.prototype, 'postSensors')
      .withArgs('', {properties: 1})
      .resolves({
        statusCode: 200,
        body: {
          features: [
            {
              properties: {
                id: 5,
              },
            },
          ],
        },
      })
      .withArgs('', {properties: 2})
      .resolves({
        statusCode: 400,
      })
      .withArgs('', {properties: 3})
      .rejects({message: 'loadSensor'});
    });

    after(() => {
      Service.prototype.getSensors.restore();
      Service.prototype.postSensors.restore();
      EtlSensors.prototype.constructor.restore();
      request.get.restore();
    });

    it('Returns filtered list of sensors', (done) => {
      test.promise
      .given(etl.getExistingSensors())
      .then((existingSensorUids) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        test.value(existingSensorUids)
        .is({
          '0': 'uniqueId1',
          '1': 'uniqueId2',
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Extracts sensors for given unique id', (done) => {
      test.promise
      .given(etl.extractUsgsSensors(['foo']))
      .then(({existingSensorUids, usgsSensors}) => {
        request.get.called.should.be.equal(true);
        test.value(usgsSensors)
        .is([
          {sensor_id: 1},
          {sensor_id: 2},
        ]);
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Resolves with a log if no sensors found', (done) => {
      let configStub = sinon.stub(testConfig, 'SENSOR_CODE')
      .value('nullCode');

      test.promise
      .given(etl.extractUsgsSensors(['foo']))
      .then(({log}) => {
        request.get.called.should.be.equal(true);
        test.value(log)
        .is('No sensors received from USGS API');

        configStub.restore();
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Compares extracted sensors with existing', (done) => {
      test.promise
      .given(etl.compareSensors(
        testData.sensorToCompare(false),
        ['uniqueId1', 'uniqueId2']
      ))
      .then((sensor) => {
        test
        .value(sensor.sourceInfo.siteCode[0].value)
        .is('someUniqueId');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Resolves with a log if existing sensor found', (done) => {
      test.promise
      .given(etl.compareSensors(
        testData.sensorToCompare(true),
        ['uniqueId1', 'uniqueId2']
      ))
      .then(({log}) => {
        test.value(log)
        .is('uniqueId1: Sensor already exists');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Skips comparison if no sensors to compare with', (done) => {
      test.promise
      .given(etl.compareSensors(
        testData.sensorToCompare(false),
        []
      ))
      .then((sensor) => {
        test
        .value(sensor.sourceInfo.siteCode[0].value)
        .is('someUniqueId');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Transforms extracted sensor properties', (done) => {
      test.promise
      .given(etl.transform(testData.dataToTransform()))
      .then((sensorMetadata) => {
        test
        .value(sensorMetadata)
        .is({
          properties: {
            uid: 'someUniqueId',
            type: 'sensorType',
            class: testConfig.SENSOR_CODE,
            units: 'ft',
          },
          location: {
            lat: 1,
            lng: 2,
          },
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Loads sensor metadata', (done) => {
      test.promise
      .given(etl.loadSensor({properties: 1}))
      .then((result) => {
        test
        .value(result.success)
        .is('5: Added sensor');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches metadata upload error', (done) => {
      test.promise
      .given(etl.loadSensor({properties: 2}))
      .then((result) => {
        test.fail('Promise was unexpectedly fulfilled. Result: '
        + result);
      })
      .catch((error) => {
        test.value(error).is({
          statusCode: 400,
        });
      })
      .finally(done)
      .done();
    });

    it('Bypasses methods in case of stored logs', (done) => {
      let methodsToTest = [
        new Promise((resolve, reject) => {
          etl.compareSensors({log: 'test1'}, [])
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          etl.transform({log: 'test2'})
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          etl.loadSensor({log: 'test3'})
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
      ];
      test.promise
      .given(Promise.all(methodsToTest))
      .then((result) => {
        test.value(result).is({
          '0': {log: 'test1'},
          '1': {log: 'test2'},
          '2': {log: 'test3'},
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches http request errors', (done) => {
      let configStub = sinon.stub(testConfig, 'SENSOR_CODE')
      .value('errorCode');

      // Swap resolve & reject callbacks to catch rejected
      // promises from methods being tested
      let methodsToTest = [
        new Promise((resolve, reject) => {
          etl.getExistingSensors()
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          etl.extractUsgsSensors(['foo'])
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          etl.loadSensor({properties: 3})
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
      ];

      test.promise
      .given(Promise.all(methodsToTest))
      .then((result) => {
        test.value(result).is({
          '0': {message: 'getExistingSensors'},
          '1': {message: 'extractUsgsSensors'},
          '2': {message: 'loadSensor'},
        });

        configStub.restore();
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });
  });
};
