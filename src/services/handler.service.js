export default (etl, callback, msg) => {
  etl.process.execute()
  .then((processes) => {
    Promise.all(processes)
    .then((processLogs) => {
      let updateCount = 0;
      let logs = [];

      for (const log of processLogs) {
        if (log.hasOwnProperty('success')) {
          updateCount += 1;
          logs.push(log.success);
        } else {
          logs.push(log);
        }
      }

      logs.unshift(msg + updateCount.toString());

      // Print success logs
      console.log(logs);
      callback(null, msg + updateCount);

    // Log error, Promise.all(processes) will exit
    }).catch((fatalLog) => {
      console.log(fatalLog);
      callback(fatalLog);
    });

  // Log error and terminate
  }).catch((error) => {
    console.log(error);
    callback(error);
  });
};
