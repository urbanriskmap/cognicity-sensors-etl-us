import Etl from './model';
import config from '../../../config';

exports.handler = (event, context, callback) => {
  const _etl = new Etl(config);

  _etl.execute()
  .then((processes) => {
    Promise.all(processes)
    .then((successLogs) => {
      let updateCount = 0;
      let logs = [];

      for (const log of successLogs) {
        if (log.hasOwnProperty('success')) {
          updateCount += 1;
          logs.push(log.success);
        }
      }

      logs.unshift(updateCount + ' sensor(s) added');

      callback(null, logs);
    })
    .catch((nonFatalLogs) => callback(null, nonFatalLogs));
  })
  .catch((processes) => {
    Promise.all(processes)
    .catch((fatalLogs) => callback(fatalLogs));
  });
};
