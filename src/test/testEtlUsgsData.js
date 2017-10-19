import * as test from 'unit.js';
import sinon from 'sinon';
import services from '../services';
import etl from '../functions/etl-data/usgs/model';

export default () => {
  describe('Extract, transform & load usgs sensor data', () => {
    before(() => {
      // sinon.stub(config, 'SENSOR_CODE')
      // .returns('sensorClass');
      sinon.stub(services, 'getSensors')
      .resolves({
        body: {
          features: [
            {
              properties: {
                id: 5,
                properties: {
                  uid: 'uniqueId',
                  class: '63160',
                },
              },
            },
            {
              properties: {
                id: 6,
                otherProperty: 'foo',
              },
            },
            {
              properties: {
                id: 7,
                properties: {
                  noUid: 'foo',
                },
              },
            },
            {
              properties: {
                id: 8,
                properties: {
                  uid: 'foo',
                  class: 'foo',
                },
              },
            },
          ],
        },
      })
      .withArgs(5)
      .resolves({
        body: [
          {
            id: 23,
            sensor_id: 5,
            properties: {
              observations: {
                upstream: [
                  {
                    dateTime: 'firstDateTime',
                    value: 'up_v1',
                  },
                  {
                    dateTime: 'secondDateTime',
                    value: 'up_v2',
                  },
                  {
                    dateTime: 'lastDateTime',
                    value: 'up_v3',
                  },
                ],
                downstream: [
                  {
                    dateTime: 'firstDateTime',
                    value: 'down_v1',
                  },
                  {
                    dateTime: 'secondDateTime',
                    value: 'down_v2',
                  },
                  {
                    dateTime: 'lastDateTime',
                    value: 'down_v3',
                  },
                ],
              },
            },
          },
        ],
      })
      .withArgs(3)
      .resolves({
        body: [
          {
            id: 27,
            sensor_id: 3,
            properties: {
              observations: {
                upstream: [
                ],
                downstream: [
                ],
              },
            },
          },
        ],
      });
    });

    after(() => {
      services.getSensors.restore();
      // config.restore();
    });

    it('Returns filtered list with valid uid and pkey', (done) => {
      test.promise
      .given(etl.filterSensors)
      .then((filteredSensorList) => {
        services.getSensors.called.should.be.equal(true);
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
        services.getSensors.called.should.be.equal(true);
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
        services.getSensors.called.should.be.equal(true);
        test.value(sensor)
        .is({pkey: 5, uid: 'uniqueId', lastUpdated: null});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });
  });
};
