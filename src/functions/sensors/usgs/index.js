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
        } else {
          logs.push(log);
        }
      }

      logs.unshift(updateCount + ' sensor(s) added');

      console.log(logs);
      callback(null, logs);
    })
    .catch((nonFatalLogs) => {
      console.log(nonFatalLogs);
      callback(null, nonFatalLogs);
    });
  })
  .catch((error) => {
    console.log(error);
    callback(error);
  });
};
