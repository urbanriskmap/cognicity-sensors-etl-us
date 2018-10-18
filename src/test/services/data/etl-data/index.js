import * as test from 'unit.js';
import sinon from 'sinon';

import * as filterService from '../../../../services/filter';
import * as getObsService from '../../../../services/data/storedObservations';
import * as extractService from '../../../../services/extract';
import * as compareService from '../../../../services/data/compare';
import * as loadService from '../../../../services/load';
import * as deleteService from '../../../../services/data/delete';

import config from './test-config';
import Etl from './model';

export default () => {
  describe('Test ETL data service', () => {
    beforeEach(() => {
      sinon.stub(filterService, 'default')
      // For test 1
      .withArgs('https://sensors.cognicity.com/', [], 'sensorAgency')
      .rejects({errorMessage: 'Internal server error'})
      // For test 2
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'}],
        'sensorAgency'
      ).resolves([])
      // For test 3, 4, 5, 6
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency'
      ).resolves([{id: '1', uid: 'xyz'}])
      // For test 7
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency_2'
      ).resolves([{id: '2', uid: 'xyz'}])
      // For test 8
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency_3'
      ).resolves([{id: '3', uid: 'xyz'}])
      // For test 9
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency_4'
      ).resolves([{id: '4', uid: 'xyz'}])
      // For test 10
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency_5'
      ).resolves([{id: '5', uid: 'xyz'}])
      // For test 11
      .withArgs(
        'https://sensors.cognicity.com/',
        [{type: 'hasProperty', values: 'uid'},
          {type: 'hasProperty', values: 'class'}],
        'sensorAgency_6'
      ).resolves([{id: '6', uid: 'xyz'}]);

      sinon.stub(getObsService, 'default')
      // For test 3
      .withArgs('https://sensors.cognicity.com/', '1', '')
      .rejects({errorMessage: 'Internal server error'})
      // For test 4, 5, 6
      .withArgs('https://sensors.cognicity.com/', '1', 'dataType')
      .resolves({})
      // For test 7
      .withArgs('https://sensors.cognicity.com/', '2', 'dataType')
      .resolves({
        checksPassed: true,
        storedObs: [{dateTime: '20180101', value: '5.00'}],
        lastDataId: '500',
      })
      // For test 8
      .withArgs('https://sensors.cognicity.com/', '3', '')
      .resolves({
        checksPassed: true,
        storedObs: [{dateTime: '20170101', value: '5.00'}],
        lastDataId: '500',
      })
      // For test 9
      .withArgs('https://sensors.cognicity.com/', '4', '')
      .resolves({
        checksPassed: true,
        storedObs: [{dateTime: '20170101', value: '5.00'}],
        lastDataId: '500',
      })
      // For test 10
      .withArgs('https://sensors.cognicity.com/', '5', '')
      .resolves({
        checksPassed: true,
        storedObs: [{dateTime: '20170101', value: '5.00'}],
        lastDataId: '750',
      })
      // For test 11
      .withArgs( 'https://sensors.cognicity.com/', '6', 'dataType')
      .resolves({
        checksPassed: false,
        storedObs: undefined,
        lastDataId: undefined,
      });

      sinon.stub(extractService, 'default')
      // For test 4
      .withArgs(
        'https://some.agency.api/',
        [{station: 'xyz'}, {period: 'P1D'}],
        ['property_1']
      ).rejects({log: {otherProperty: 'foo'}})
      // For test 5
      .withArgs(
        'https://some.agency.api/',
        [{station: 'xyz'}, {period: 'P1D'}],
        ['property_2']
      ).rejects({errorMessage: 'Agency API error'})
      // For test 6
      .withArgs(
        'https://some.agency.api/',
        [{station: 'xyz'}, {period: 'P1D'}],
        ['noObservations']
      ).resolves({observations: []})
      // For test 7, 8, 9, 10, 11
      .withArgs(
        'https://some.agency.api/',
        [{station: 'xyz'}, {period: 'P1D'}],
        ['observations']
      ).resolves({observations: [{
          timestamp: '20180101',
          measurement: '5.00',
      }]});

      const newObservations = [{
        dateTime: '20180101',
        value: '5.00',
      }];

      sinon.stub(compareService, 'default')
      // For test 7
      .withArgs('', newObservations, '20180101', undefined)
        .resolves({exit: true})
      // For test 8, 9, 10
      .withArgs('', newObservations, '20170101', undefined)
        .resolves({exit: false})
      // For test 11
      .withArgs('', newObservations, null, true)
        .resolves({exit: false});

      sinon.stub(loadService, 'default')
      // For test 8
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {properties: {observations: newObservations}},
        '3'
      ).rejects({log: 'Failed to load sensor data'})
      // For test 9
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {properties: {observations: newObservations}},
        '4'
      ).resolves({newDataId: '1000'})
      // For test 10
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {properties: {observations: newObservations}},
        '5'
      ).resolves({newDataId: '1500'})
      // For test 11
      .withArgs(
        'https://sensors.cognicity.com/',
        'apiKey',
        {properties: {
          observations: newObservations,
          type: 'dataType',
        }},
        '6'
      ).resolves({newDataId: '1000'})
      ;

      sinon.stub(deleteService, 'default')
      // For test 9
      .withArgs('https://sensors.cognicity.com/', 'apiKey', '4', '500')
      .rejects({errorMessage: 'Internal server error'})
      // For test 10
      .withArgs('https://sensors.cognicity.com/', 'apiKey', '5', '750' )
      .resolves();
    });

    // Test 1
    it('Terminates with log if request to Sensors API fails', (done) => {
      const etl = new Etl(config);

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

    // Test 2
    it('Terminates with log if no sensors retrieved from cognicity API',
    (done) => {
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'}
      );

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
    it('Stores log if request to retrieve sensor data fails', (done) => {
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({
          log: 'Error retrieving data from congnicity API for sensor id: 1',
          error: JSON.stringify({errorMessage: 'Internal server error'}),
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 4
    it('Stores log if no data retrieved from agency API', (done) => {
      config.DATA_TYPE = 'dataType';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'property_1'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({
          log: 'No data, or incongruent format',
          queryParameters: JSON.stringify([
            {station: 'xyz'},
            {period: 'P1D'},
          ]),
          error: JSON.stringify({otherProperty: 'foo'}),
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 5
    it('Stores log if request to retrieve data from agency API fails',
    (done) => {
      config.DATA_TYPE = 'dataType';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'property_2'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({
          log: 'Error connecting Agency API',
          queryParameters: JSON.stringify([
            {station: 'xyz'},
            {period: 'P1D'},
          ]),
          error: JSON.stringify({errorMessage: 'Agency API error'}),
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 6
    it('Stores log if data transformation fails', (done) => {
      config.DATA_TYPE = 'dataType';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'noObservations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is('1: No valid data available');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 7
    it('Stores log if extracted data is same as stored', (done) => {
      config.DATA_TYPE = 'dataType';
      config.SENSOR_AGENCY = 'sensorAgency_2';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'observations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is('2: No new data available');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 8
    it('Stores log if new data failed to load', (done) => {
      config.DATA_TYPE = '';
      config.SENSOR_AGENCY = 'sensorAgency_3';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'observations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is('Failed to load sensor data');
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 9
    it('Stores log with details if failed to delete previous data row',
    (done) => {
      config.SENSOR_AGENCY = 'sensorAgency_4';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'observations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({
          log: 'Failed to remove previous observations for sensor'
          + ' id: 4, data id: 500',
          error: JSON.stringify({errorMessage: 'Internal server error'}),
        });
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 10
    it('Stores log with details after successfully deleting previous data row',
    (done) => {
      config.SENSOR_AGENCY = 'sensorAgency_5';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'observations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({success: 'Data updated. Sensor ID: 5, Data ID: 1500'});
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    // Test 11
    it('Stores log with details of new data row', (done) => {
      config.DATA_TYPE = 'dataType';
      config.SENSOR_AGENCY = 'sensorAgency_6';
      const etl = new Etl(config);
      etl.sensorParameters.filterConditions.push(
        {type: 'hasProperty', values: 'uid'},
        {type: 'hasProperty', values: 'class'}
      );
      etl.sensorParameters.dataStructureKeys.push(
        'observations'
      );

      test.promise
      .given(etl.process.execute())
      .then((logs) => {
        test.value(logs[0])
        .is({success: 'Data stored. Sensor ID: 6, Data ID: 1000'});
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    afterEach(() => {
      filterService.default.restore();
      getObsService.default.restore();
      extractService.default.restore();
      compareService.default.restore();
      loadService.default.restore();
      deleteService.default.restore();
    });
  });
};
