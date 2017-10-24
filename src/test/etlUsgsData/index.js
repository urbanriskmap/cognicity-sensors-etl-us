import * as test from 'unit.js';
import sinon from 'sinon';
import request from 'request';
import {Service} from '../../services';
import {EtlData} from '../../functions/etl-data/usgs/model';
import testData from './test-data';
import testConfig from '../test-config';

export default () => {
  describe('ETL USGS sensors data', () => {
    let etl;
    before(() => {
      sinon.stub(EtlData.prototype, 'constructor')
      .returns(testConfig);

      etl = new EtlData(testConfig);

      sinon.stub(Service.prototype, 'getSensors')
      .onFirstCall()
      .resolves(testData.getSensorsNoArgs())
      .withArgs(5)
      .resolves(testData.getDataWithObs())
      .withArgs(3)
      .resolves(testData.getDataNoObs())
      .onCall(3)
      .rejects({message: 'filterSensors'})
      .withArgs(404)
      .rejects({message: 'getStoredObservations'});

      let mockUsgsQuery = (uid) => {
        return testConfig.USGS_BASE_URL
        + '&sites=' + uid
        + '&period=' + testConfig.RECORDS_PERIOD;
      };

      sinon.stub(request, 'get')
      .withArgs({
        url: mockUsgsQuery('uniqueId'),
        json: true,
      })
      .yields(null, null, testData.getUsgsObs(true))
      .withArgs({
        url: mockUsgsQuery('otherUniqueId'),
        json: true,
      })
      .yields(null, null, {
        value: {
          timeSeries: [],
        },
      })
      .withArgs({
        url: mockUsgsQuery('errorId'),
        json: true,
      })
      .yields({message: 'extractSensorObservations'}, null, null);

      sinon.stub(Service.prototype, 'postSensors')
      .withArgs(5, {properties: {observations: {}}})
      .resolves({
        statusCode: 200,
        body: [
          {sensor_id: 5},
        ],
      })
      .withArgs(7, {properties: {observations: {}}})
      .resolves({
        statusCode: 400,
      })
      .withArgs(9, {properties: {observations: {}}})
      .rejects({message: 'loadObservations'});
    });

    after(() => {
      Service.prototype.getSensors.restore();
      Service.prototype.postSensors.restore();
      EtlData.prototype.constructor.restore();
      request.get.restore();
    });

    it('Returns filtered list with valid uid and pkey', (done) => {
      test.promise
      .given(etl.filterSensors())
      .then((filteredSensorList) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        let sensor = filteredSensorList[0];
        test.value(sensor)
        .is({pkey: 5, uid: 'uniqueId'});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Returns last updated dateTime for sensor data', (done) => {
      test.promise
      .given(etl.getStoredObservations(5, 'uniqueId'))
      .then((sensor) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        test.value(sensor)
        .is({pkey: 5, uid: 'uniqueId', lastUpdated: 'lastDateTime'});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Returns null for last updated if no data stored', (done) => {
      test.promise
      .given(etl.getStoredObservations(3, 'uniqueId'))
      .then((sensor) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        test.value(sensor)
        .is({pkey: 3, uid: 'uniqueId', lastUpdated: null});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Extracts observations for USGS sensor', (done) => {
      test.promise
      .given(etl.extractSensorObservations({
        uid: 'uniqueId',
        pkey: 5,
        lastUpdated: null,
      }))
      .then((data) => {
        request.get.called.should.be.equal(true);
        test.value(
          data.storedProperties.uid
        ).is('uniqueId');
        test.value(
          data.usgsData[0].values[0].value[0].dateTime
        ).is('upstream_1');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Stores log if no USGS observations found', (done) => {
      test.promise
      .given(etl.extractSensorObservations({
        uid: 'otherUniqueId',
        pkey: 7,
        lastUpdated: null,
      }))
      .then((result) => {
        request.get.called.should.be.equal(true);
        test.value(
          result.log
        ).is(
          '7: Sensor is inactive or has no new observations in past '
          + testConfig.RECORDS_INTERVAL.slice(2, -1) + ' minute(s).'
        );
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Transforms extracted data (with up, down)', (done) => {
      let argData = testData.getUsgsObs(true);
      test.promise
      .given(etl.transform({
        storedProperties: {
          uid: 'uniqueId',
          pkey: 5,
          lastUpdated: null,
        },
        usgsData: argData.value.timeSeries,
      }))
      .then((sensor) => {
        test.value(sensor).is({
          pkey: 5,
          data: {
            upstream: [
              {dateTime: 'upstream_1', value: 3.1},
              {dateTime: 'upstream_2', value: 3.3},
            ],
            downstream: [
              {dateTime: 'downstream_1', value: 2.9},
              {dateTime: 'downstream_2', value: 3.0},
            ],
          },
          lastUpdated: null,
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Transforms extracted data (w/o up, down)', (done) => {
      let configStub = sinon.stub(testConfig, 'HAS_UPSTREAM_DOWNSTREAM')
      .value(false);
      let argData = testData.getUsgsObs(false);

      test.promise
      .given(etl.transform({
        storedProperties: {
          uid: 'uniqueId',
          pkey: 7,
          lastUpdated: null,
        },
        usgsData: argData.value.timeSeries,
      }))
      .then((sensor) => {
        test.value(sensor).is({
          pkey: 7,
          data: [
            {dateTime: 'dateTime_1', value: 4.0},
            {dateTime: 'dateTime_2', value: 4.2},
          ],
          lastUpdated: null,
        });
        configStub.restore();
      })
      .catch((error) => {
        test.fail(error.message);
        configStub.restore();
      })
      .finally(done)
      .done();
    });

    it('Compares sensor observations (updated data)', (done) => {
      test.promise
      .given(etl.compareSensorObservations({
        pkey: 5,
        data: {
          upstream: [
            {dateTime: 'oldDateTime'},
            {dateTime: 'newDateTime'},
          ],
        },
        lastUpdated: 'latestDateTime',
      }))
      .then((result) => {
        test
        .value(result.data.upstream[1].dateTime)
        .is('newDateTime');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Compares sensor observations (no updates)', (done) => {
      test.promise
      .given(etl.compareSensorObservations({
        pkey: 5,
        data: {
          upstream: [
            {dateTime: 'someDateTime'},
            {dateTime: 'latestDateTime'},
          ],
        },
        lastUpdated: 'latestDateTime',
      }))
      .then((result) => {
        test
        .value(result.log)
        .is('5: Sensor has no new observations');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Loads observations', (done) => {
      test.promise
      .given(etl.loadObservations({
        pkey: 5,
        data: {},
      }))
      .then((result) => {
        test
        .value(result.success)
        .is('5: Data for sensor updated');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches data upload error', (done) => {
      test.promise
      .given(etl.loadObservations({
        pkey: 7,
        data: {},
      }))
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
          etl.transform({log: 'test1'})
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          etl.compareSensorObservations({log: 'test2'})
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          etl.compareSensorObservations({lastUpdated: false})
          .then((result) => resolve(result))
          .catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          etl.loadObservations({log: 'test3'})
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
          '2': {lastUpdated: false},
          '3': {log: 'test3'},
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches http request errors', (done) => {
      // Swap resolve & reject callbacks to catch rejected
      // promises from methods being tested
      let methodsToTest = [
        new Promise((resolve, reject) => {
          etl.filterSensors()
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          etl.getStoredObservations(404, 'uniqueId')
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          etl.extractSensorObservations({
            uid: 'errorId',
            pkey: 9,
            lastUpdated: null,
          })
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          etl.loadObservations({
            pkey: 9,
            data: {},
          })
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
      ];

      test.promise
      .given(Promise.all(methodsToTest))
      .then((result) => {
        test.value(result).is({
          '0': {message: 'filterSensors'},
          '1': {message: 'getStoredObservations'},
          '2': {message: 'extractSensorObservations'},
          '3': {message: 'loadObservations'},
        });
      })
      .catch((error) => {
        test.fail(error);
      })
      .finally(done)
      .done();
    });
  });
};
