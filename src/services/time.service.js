export default class {
  constructor(config) {
    this.config = config;
  }

  getNoaaQueryTimeFormat() {
    const formatDateString = (date) => {
      return date.getFullYear() +
      (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1)
      + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + '%20'
      + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + '%3A'
      + '00';
    };

    const recordsPeriodMs = parseInt(
      this.config.RECORDS_PERIOD.slice(1, -1), 10
    ) * 24 * 60 * 60 * 1000; // In days
    const predictPeriodMs = parseInt(
      this.config.PREDICTION_PERIOD.slice(2, -1), 10
    ) * 60 * 60 * 1000; // In hours

    const now = new Date();
    const start = new Date(Date.parse(now) - recordsPeriodMs);
    const predict = new Date(Date.parse(now) + predictPeriodMs);

    return {
      begin: formatDateString(start),
      now: formatDateString(now),
      end: formatDateString(predict),
    };
  }

  getWmdQueryTimeFormat() {
    const formatDateString = (date) => {
      return date.getFullYear()
      + '-' + // getMonth returns integer between 0 & 11, required 01 & 12
      (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1)
      + '-' + // getDate returns integer between 1 & 31, required 01 & 31
      (date.getDate() < 10 ? '0' + date.getDate() : date.getDate())
      + // getHours returns integer between 0 & 23, required 00 & 23
      (date.getHours() < 10 ? '0' + date.getHours() : date.getHours())
      + ':00:00:000';
    };

    const periodMilliseconds = parseInt(
      this.config.RECORDS_PERIOD.slice(1, -1),
      10
    ) * 24 * 60 * 60 * 1000;

    const now = new Date();
    const start = new Date(Date.parse(now) - periodMilliseconds);

    const begin = formatDateString(start);
    const end = formatDateString(now);

    return {
      begin: begin,
      end: end,
    };
  }
}
