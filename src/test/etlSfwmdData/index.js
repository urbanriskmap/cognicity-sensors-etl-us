import * as test from 'unit.js';
import sinon from 'sinon';
// import request from 'request';

import Service from '../../services/http.service';
import {EtlData} from '../../functions/etl-data/sfwmd/timeseries/model';
import testData from './test-data';
import testConfig from '../test-config';

export default () => {
  describe('ETL SFWMD stations data', () => {
    let etl;

    before(() => {
      sinon.stub(EtlData.prototype, 'constructor')
      .returns(testConfig);

      etl = new EtlData(testConfig);

      sinon.stub(Service.prototype, 'getSensors')
      .withArgs('someAgency')
        .onFirstCall()
          .resolves(testData.getSensorsNoArgs());
    });

    after(() => {
      Service.prototype.getSensors.restore();
      EtlData.prototype.constructor.restore();
    });

    it('Returns filtered list with valid uid and id', (done) => {
      test.promise
      .given(etl.filterStations())
      .then((filteredSensorList) => {
        Service.prototype.getSensors.called.should.be.equal(true);
        let sensor = filteredSensorList[0];
        test.value(sensor)
        .is({id: 3, uid: 'uniqueId'});
      })
      .catch((error) => {
        test.fail(error.message);
      })
      .finally(done)
      .done();
    });
  });
};
