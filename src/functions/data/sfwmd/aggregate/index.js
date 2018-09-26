import Etl from './model';
import _handler from '../../../../services/handler.service';
import config from '../../../../config';

exports.handler = (event, context, callback) => {
  const msg = 'Station data rows updated: ';

  // Call handler method from service
  _handler(
    new Etl(config),
    callback,
    msg
  );
};
