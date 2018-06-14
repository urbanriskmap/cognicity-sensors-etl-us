import * as test from 'unit.js';
import sinon from 'sinon';
import {Service} from '../../services';
import {UploadStations} from '../../functions/etl-sensors/sfwmd/model';
import testData from './test-data';
import testConfig from '../test-config';

export default () => {
  describe('Upload SFWMD Stations', () => {
    let upload;
    before(() => {
      sinon.stub(UploadStations.prototype, 'constructor')
      .returns(testConfig);

      upload = new UploadStations(testConfig);

      sinon.stub(Service.prototype, 'getSensors')
      .onFirstCall()
      .resolves(testData.getStations())
      .onSecondCall()
      .resolves({
        result: {
          features: [],
        },
      })
      .onThirdCall()
      .rejects({message: 'getExistingStations'});

      sinon.stub(Service.prototype, 'postSensors')
      .withArgs('', {properties: 1})
      .resolves({
        statusCode: 200,
        result: {
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
      .rejects({message: 'loadStation'});
    });

    after(() => {
      Service.prototype.getSensors.restore();
      Service.prototype.postSensors.restore();
      UploadStations.prototype.constructor.restore();
    });

    it('Returns filtered list of stations', (done) => {
      test.promise
      .given(upload.getExistingStations())
      .then((existingStationIds) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        test.value(existingStationIds)
        .is({
          '0': 'S9-H',
          '1': 'S30-S-Q',
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Returns empty array when no station found', (done) => {
      test.promise
      .given(upload.getExistingStations())
      .then((existingStationIds) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        test.value(existingStationIds)
        .is({});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Compares station with existing list', (done) => {
      test.promise
      .given(upload.compareStations(
        testData.stationToCompare(),
        ['S30-H', 'S30-T', 'S30-S-Q']
      ))
      .then((station) => {
        test
        .value(station.properties.stationId)
        .is('S39-H');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Skips comparison if no stations to compare with', (done) => {
      test.promise
      .given(upload.compareStations(
        testData.stationToCompare(),
        []
      ))
      .then((station) => {
        test
        .value(station.properties.stationId)
        .is('S39-H');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Resolves with a log if existing station found', (done) => {
      test.promise
      .given(upload.compareStations(
        testData.stationToCompare(),
        ['S39-H', 'S39-T', 'S39-S-Q']
      ))
      .then(({log}) => {
        test.value(log)
        .is('S39-H: Station already exists');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Loads station metadata', (done) => {
      test.promise
      .given(upload.loadStation({properties: 1}))
      .then((result) => {
        test
        .value(result.success)
        .is('5: Added station');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Skips upload if station exists', (done) => {
      test.promise
      .given(upload.loadStation({log: 'S39-H: Station already exists'}))
      .then((result) => {
        test.value(result.log)
        .is('S39-H: Station already exists');
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });

    it('Catches metadata upload error', (done) => {
      test.promise
      .given(upload.loadStation({properties: 2}))
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

    it('Catches http request errors', (done) => {
      // Swap resolve & reject callbacks to catch rejected
      // promises from methods being tested
      const methodsToTest = [
        new Promise((resolve, reject) => {
          upload.getExistingStations()
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
        new Promise((resolve, reject) => {
          upload.loadStation({properties: 3})
          .then((result) => reject(result))
          .catch((error) => resolve(error));
        }),
      ];

      test.promise
      .given(Promise.all(methodsToTest))
      .then((result) => {
        test.value(result).is({
          '0': {message: 'getExistingStations'},
          '1': {message: 'loadStation'},
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
