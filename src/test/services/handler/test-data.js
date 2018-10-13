export default {
  successLogs: [
    {success: '1: Success adding sensor'},
    {success: '2: Success adding sensor'},
    {log: '3: Sensor already exists, skipped'},
    {success: '4: Success adding sensor'},
  ],

  singleErrorLogs: [
    {success: '1: Success adding sensor'},
    {
      log: '2: Agency API error',
      error: {
        statusCode: 404,
        message: 'URL not found',
      },
    },
    {success: '3: Success adding sensor'},
  ],

  success: {
    process: {
      execute: () => {
        let etlProcesses = [];

        return new Promise((resolve, reject) => {
          for (const log of exports.default.successLogs) {
            etlProcesses.push(
              new Promise((res, rej) => {
                res(log);
              })
            );
          }

          resolve(etlProcesses);
        });
      },
    },
  },

  processError: {
    process: {
      execute: () => {
        let etlProcesses = [];

        return new Promise((resolve, reject) => {
          for (const log of exports.default.singleErrorLogs) {
            etlProcesses.push(
              new Promise((res, rej) => {
                if (log.hasOwnProperty('success')) {
                  res(log);
                } else {
                  rej(log);
                }
              })
            );
          }

          resolve(etlProcesses);
        });
      },
    },
  },

  executionError: {
    process: {
      execute: () => {
        return new Promise((resolve, reject) => {
          reject('Fatal error');
        });
      },
    },
  },
};
