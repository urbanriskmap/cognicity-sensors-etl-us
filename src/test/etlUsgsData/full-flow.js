import * as test from 'unit.js';
import sinon from 'sinon';
import request from 'request';

import {Service} from '../../services';
import {callEtlMethods} from '../../functions/etl-data/usgs/index';
import {EtlData} from '../../functions/etl-data/usgs/model';
import testConfig from '../test-config';

const stubData = {
  getMetadata: {
    'body': {
      'features': [
        {
          'properties': {
            'id': '54',
            'created': '2017-10-25T00:06:39.355Z',
            'properties': {
              'uid': '261150080270001',
              'agency': 'usgs',
              'type': 'ST-CA',
              'class': '63610',
              'units': 'ft',
            },
          },
        },
      ],
    },
  },

  getData: {
    'body': [
      {
        'id': '36396',
        'sensor_id': '54',
        'created': '2017-12-12T08:04:21.842Z',
        'properties': {
          'observations': {
            'upstream': [
              {
                'value': '13.16',
                'dateTime': '2017-12-11T03:15:00.000-05:00',
              },
              {
                'value': '13.18',
                'dateTime': '2017-12-11T03:30:00.000-05:00',
              },
              {
                'value': '13.20',
                'dateTime': '2017-12-11T03:45:00.000-05:00',
              },
            ],
            'downstream': [
              {
                'value': '11.06',
                'dateTime': '2017-12-11T03:15:00.000-05:00',
              },
              {
                'value': '11.08',
                'dateTime': '2017-12-11T03:30:00.000-05:00',
              },
              {
                'value': '11.10',
                'dateTime': '2017-12-11T03:45:00.000-05:00',
              },
            ],
          },
        },
      },
      {
        'id': '38036',
        'sensor_id': '54',
        'created': '2017-12-14T14:04:22.023Z',
        'properties': {
          'observations': {
            'upstream': [
              {
                'value': '13.05',
                'dateTime': '2017-12-13T09:15:00.000-05:00',
              },
              {
                'value': '13.07',
                'dateTime': '2017-12-13T09:30:00.000-05:00',
              },
              {
                'value': '13.09',
                'dateTime': '2017-12-13T09:45:00.000-05:00',
              },
            ],
            'downstream': [
              {
                'value': '11.15',
                'dateTime': '2017-12-13T09:15:00.000-05:00',
              },
              {
                'value': '11.17',
                'dateTime': '2017-12-13T09:30:00.000-05:00',
              },
              {
                'value': '11.19',
                'dateTime': '2017-12-13T09:45:00.000-05:00',
              },
            ],
          },
        },
      },
    ],
  },

  usgsData: {
    'value': {
      'timeSeries': [
        {
          'values': [
            {
              'value': [
                {
                  'value': '9.28',
                  'dateTime': '2018-03-06T15:45:00.000-05:00',
                },
                {
                  'value': '9.26',
                  'dateTime': '2018-03-06T16:00:00.000-05:00',
                },
                {
                  'value': '9.24',
                  'dateTime': '2018-03-06T16:15:00.000-05:00',
                },
              ],
            },
            {
              'value': [
                {
                  'value': '12.12',
                  'dateTime': '2018-03-06T15:45:00.000-05:00',
                },
                {
                  'value': '12.14',
                  'dateTime': '2018-03-06T16:00:00.000-05:00',
                },
                {
                  'value': '12.16',
                  'dateTime': '2018-03-06T16:15:00.000-05:00',
                },
              ],
            },
          ],
        },
      ],
    },
  },

  postObservations: {
    'properties': {
      'observations': {
        'upstream': [
          {
            'value': '9.28',
            'dateTime': '2018-03-06T15:45:00.000-05:00',
          },
          {
            'value': '9.26',
            'dateTime': '2018-03-06T16:00:00.000-05:00',
          },
          {
            'value': '9.24',
            'dateTime': '2018-03-06T16:15:00.000-05:00',
          },
        ],
        'downstream': [
          {
            'value': '12.12',
            'dateTime': '2018-03-06T15:45:00.000-05:00',
          },
          {
            'value': '12.14',
            'dateTime': '2018-03-06T16:00:00.000-05:00',
          },
          {
            'value': '12.16',
            'dateTime': '2018-03-06T16:15:00.000-05:00',
          },
        ],
      },
    },
  },
};

export default () => {
  describe('ETL Data full flow', () => {
    let etl;
    before(() => {
      sinon.stub(EtlData.prototype, 'constructor')
      .returns(testConfig);

      etl = new EtlData(testConfig);

      sinon.stub(Service.prototype, 'getSensors')
      // For filterSensors()
      .onFirstCall()
      .resolves(
        // Mock get sensors query result
        stubData.getMetadata
      )
      // For getStoredObservations()
      .withArgs(54) // test sensor_id
      .resolves(
        // Mock get sensors by id query result
        stubData.getData
      );

      // For extractSensorObservations()
      sinon.stub(request, 'get')
      .withArgs({
        url: testConfig.USGS_BASE_URL
          + '&sites=uniqueId'
          + '&period=' + testConfig.RECORDS_PERIOD,
        json: true,
      })
      .yields(
        // Mock usgs query result
        stubData.usgsData
      );

      // For loadObservations()
      sinon.stub(Service.prototype, 'postSensors')
      .withArgs(54, stubData.postObservations)
      .resolves({
        // Mock post sensor data query result
        statusCode: 200,
        body: [
          {sensor_id: 54},
        ],
      });

      // For loadObservations()
      sinon.stub(Service.prototype, 'deleteObservations')
      .withArgs(54, 38036)
      .resolves({
        // Mock delete observation by data_id query result
        statusCode: 200,
        body: [],
      });
    });

    after(() => {
      // Restore stubbed services
      Service.prototype.getSensors.restore();
      Service.prototype.postSensors.restore();
      Service.prototype.deleteObservations.restore();
      EtlData.prototype.constructor.restore();
      request.get.restore();
    });

    it('Updates data', (done) => {
      // write test here
      test.promise
      .given(callEtlMethods(etl))
      .then((result) => {
        console.log(result);
        test.value(result).is({
          sensors_updated: 1,
          logs: '54: Data for sensor updated',
        });
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });
  });
};
