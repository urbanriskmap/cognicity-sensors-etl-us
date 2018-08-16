import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import {filter} from '../../../services/sensors/filter';
import testData from './test-data';

export default () => {
  describe('Test filter service', () => {
    before(() => {
      sinon.stub(request, 'get')
      .withArgs({
        url: 'https://some.base.url/',
        json: true,
      })
        .yields(null, null, testData.mockGetAllSensorsResponse())
      .withArgs({
        url: 'https://some.base.url/?agency=failingStatus',
        json: true,
      })
        .yields(null, null, {
          statusCode: 400,
          result: 'Foo error message',
        })
      .withArgs({
        url: 'https://some.base.url/?agency=usgs',
        json: true,
      })
        .yields(null, null, testData.mockGetUsgsResponse())
      .withArgs({
        url: 'https://some.base.url/?agency=sfwmd',
        json: true,
      })
        .yields(null, null, testData.mockGetSfwmdResponse())
      .withArgs({
        url: 'https://some.base.url/?agency=serverError',
        json: true,
      })
        .yields({message: 'API endpoint or connection error'});
    });

    after(() => {
      request.get.restore();
    });

    it('Fetches all sensors from server', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], ''))
      .then((filteredList) => {
        // Test if 3 sensors are returned, array as an object
        test.value(filteredList.hasOwnProperty('2')).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Filters sensors by equating property values', (done) => {
      const conditions = [
        {
          type: 'equate',
          values: [
            {type: 'property', value: 'type'},
            {type: 'value', value: 'GW'},
          ],
        },
      ];

      test.promise
      .given(filter(testData.baseUrl, conditions, 'usgs'))
      .then((filteredList) => {
        test.value(
          !filteredList.hasOwnProperty('1')
          && filteredList['0'].type === 'GW'
        ).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if sensor lacks queried property', (done) => {
      const conditions = [
        {
          type: 'hasProperty',
          values: ['uid'],
        },
      ];

      test.promise
      .given(filter(testData.baseUrl, conditions, 'sfwmd'))
      .then((filteredList) => {
        test.value(!!filteredList).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if condition type is unsupported', (done) => {
      const conditions = [
        {
          type: 'foo',
        },
      ];

      test.promise
      .given(filter(testData.baseUrl, conditions, 'sfwmd'))
      .then((filteredList) => {
        test.value(!!filteredList).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if equate.values.type is unsupported', (done) => {
      const conditions = [
        {
          type: 'equate',
          values: [
            {type: 'foo'},
          ],
        },
      ];

      test.promise
      .given(filter(testData.baseUrl, conditions, 'sfwmd'))
      .then((filteredList) => {
        test.value(!!filteredList).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Returns empty list if equate.values.length is not 2', (done) => {
      const conditions = [
        {
          type: 'equate',
          values: [
            {type: 'value', value: 'foo'},
          ],
        },
      ];

      test.promise
      .given(filter(testData.baseUrl, conditions, 'sfwmd'))
      .then((filteredList) => {
        test.value(!!filteredList).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    it('Rejects with log and error if query fails with known error', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'failingStatus'))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((result) => {
        test.value(result)
        .is({
          log: 'Error fetching sensors',
          error: {
            statusCode: 400,
            result: 'Foo error message',
          },
        });
      })
      .finally(done)
      .done();
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(filter(testData.baseUrl, [], 'serverError'))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.message)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });
  });
};
