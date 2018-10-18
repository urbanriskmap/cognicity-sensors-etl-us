import * as test from 'unit.js';
import sinon from 'sinon';

import * as extractService from '../../../../services/extract';
import * as filterService from '../../../../services/filter';
import * as compareService from '../../../../services/sensors/compare';
import * as loadService from '../../../../services/load';

// import testData from './test-data';
import config from './test-config';
import Etl from './model';

export default () => {
  describe('Test ETL sensors service', () => {
    before(() => {
      sinon.stub(extractService, 'default')
      // For test 2
      .withArgs(
        'https://some.agency.api/',
        [{status: 'inactive'}],
        []
      )
        .resolves({sensors: []})
      // For test 3
      .withArgs(
        'https://some.agency.api/',
        [{status: 'active'}],
        ['1']
      )
        .rejects({errorMessage: 'API server error'})
      // For test 4
      .withArgs(
        'https://some.agency.api/',
        [{status: 'active'}],
        ['2']
      )
        .resolves({sensors: [{uid: '2'}]})
      // For test 5
      .withArgs(
        'https://some.agency.api/',
        [{status: 'active'}],
        ['3']
      )
        .resolves({sensors: [{uid: '3'}]})
      // For test 6
      .withArgs(
        'https://some.agency.api/',
        [{status: 'active'}],
        ['4']
      )
        .resolves({sensors: [{uid: '4', class: 'X'}]});

      sinon.stub(filterService, 'default')
      // For test 4
      .withArgs(
        'https://sensors.cognicity.com/',
        [],
        'sensorAgency'
      )
        .rejects({errorMessage: 'Internal server error'})
      // For test 5
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'}],
        'sensorAgency'
      )
        .resolves([{uid: '3'}])
      // For test 6
      .withArgs(
        'https://sensors.cognicity.com/',
        [
          {type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'},
        ],
        'sensorAgency'
      )
        .resolves([{uid: '1'}])
      // For test 7
      .withArgs(
        'https://sensors.cognicity.com/',
        [
          {type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'},
          {type: 'hasProperty', values: 'units'},
        ],
        'sensorAgency'
      )
        .resolves([{uid: '1'}]);

      sinon.stub(compareService, 'default')
      // For test 5
      .withArgs(
        {uid: '3'},
        'uid',
        ['3']
      )
        .resolves({log: '3'})
      // For test 6
      .withArgs(
        {uid: '4', class: 'X'},
        'uid',
        ['1']
      )
        .resolves({uid: '4', class: 'X'})
      // For test 7
      .withArgs(
        {uid: '5', class: 'X', units: 'ft'},
        'uid',
        ['1']
      )
        .resolves({uid: '5', class: 'X', units: 'ft'});

      sinon.stub(loadService, 'default')
      // For test 6
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {uid: '4', class: 'X'}
      )
        .rejects({log: {
          statusCode: 404,
          error: 'Internal server error',
        }})
      // For test 7
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {uid: '5', class: 'X', units: 'ft'}
      )
        .resolves({id: '10'});
    });

    // Test 1
    it('Terminates with log if neither queryParams nor sensors list provided',
    (done) => {
      const etl = new Etl(config);

      test.promise
      .given(etl.process.execute())
      .then(() => test.fail('Promise was fulfilled unexpectedly'))
      .catch((error) => {
        test.value(error.log)
        .is('Either of query sets or sensors list required');
      })
      .finally(done)
      .done();
    });

    // Test 2
    it('Terminates with log if no sensors extracted from agency API',
    (done) => {
      const etl = new Etl(config);

      etl.sensorParameters.querySets = [
        {status: 'inactive'},
      ];

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is('No sensors found matching the given conditions');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 3
    it('Terminates with log if request to cognicity API fails',
    (done) => {
      const etl = new Etl(config);

      etl.sensorParameters.querySets = [
        {status: 'active'},
      ];
      etl.sensorParameters.dataStructureKeys.push('1');

      test.promise
      .given(etl.process.execute())
      .then(() => test.fail('Promise was fulfilled unexpectedly'))
      .catch((error) => {
        test.value(error)
        .is({
          log: 'Error connecting Agency API',
          error: JSON.stringify({errorMessage: 'API server error'}),
        });
      })
      .finally(done)
      .done();
    });

    // Test 4
    it('Terminates with log if request to Sensors API fails',
    (done) => {
      const etl = new Etl(config);
      etl.sensorParameters.querySets = [
        {status: 'active'},
      ];
      etl.sensorParameters.dataStructureKeys.push('2');

      test.promise
      .given(etl.process.execute())
      .then(() => test.fail('Promise was fulfilled unexpectedly'))
      .catch((error) => {
        test.value(error)
        .is({
          log: 'Error connecting congnicity sensors API',
          error: JSON.stringify({errorMessage: 'Internal server error'}),
        });
      })
      .finally(done)
      .done();
    });

    // Test 5
    it('Resolves with log message if sensor already exists',
    (done) => {
      const etl = new Etl(config);
      etl.sensorParameters.querySets = [
        {status: 'active'},
      ];
      etl.sensorParameters.dataStructureKeys.push('3');
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'}
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is('Sensor already stored, id: 3');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 6
    it('Resolves with log message if sensor failed to load',
    (done) => {
      const etl = new Etl(config);
      etl.sensorParameters.querySets = [
        {status: 'active'},
      ];
      etl.sensorParameters.dataStructureKeys.push('4');
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({statusCode: 404, error: 'Internal server error'});
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 7
    it('Resolves with log message if loaded successfully',
    (done) => {
      delete(config.API_ENDPOINT);
      const etl = new Etl(config);
      etl.sensorParameters.list = [{uid: '5', class: 'X', units: 'ft'}];
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'},
        {type: 'hasProperty', values: 'units'}
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0].success)
        .is('Sensor stored. Id: 10');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    after(() => {
      extractService.default.restore();
      filterService.default.restore();
      compareService.default.restore();
      loadService.default.restore();
    });
  });
};
