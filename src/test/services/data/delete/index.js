import * as test from 'unit.js';
import request from 'request';
import sinon from 'sinon';

import deleteService from '../../../../services/data/delete';

export default () => {
  describe('Test delete data service', () => {
    const baseUrl = 'https://some.base.url/';

    before(() => {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': 'apiKey',
      };

      sinon.stub(request, 'delete')
      .withArgs({
        url: 'https://some.base.url/5/100',
        headers: headers,
      })
        .yields({message: 'API endpoint or connection error'})
      .withArgs({
        url: 'https://some.base.url/6/200',
        headers: headers,
      })
        .yields(null, null,
          '{"statusCode":400,"result":"Internal server error"}')
      .withArgs({
        url: 'https://some.base.url/7/300',
        headers: headers,
      })
        .yields(null, null, '{"statusCode":200,"result":{}}');
    });

    it('Rejects with error message if query fails', (done) => {
      test.promise
      .given(deleteService(baseUrl, 'apiKey', 5, 100))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error.message)
        .is('API endpoint or connection error');
      })
      .finally(done)
      .done();
    });

    it('Rejects with log if statusCode is not 200', (done) => {
      test.promise
      .given(deleteService(baseUrl, 'apiKey', 6, 200))
      .then(() => test.fail('Promise was unexpectedly fulfilled'))
      .catch((error) => {
        test.value(error).is(
          '{"statusCode":400,"result":"Internal server error"}'
        );
      })
      .finally(done)
      .done();
    });

    it('Resolves with no object after successful deletion', (done) => {
      test.promise
      .given(deleteService(baseUrl, 'apiKey', 7, 300))
      .then(({deleted}) => {
        test.value(deleted).is(true);
      })
      .catch((error) => test.fail(error))
      .finally(done)
      .done();
    });

    after(() => {
      request.delete.restore();
    });
  });
};
