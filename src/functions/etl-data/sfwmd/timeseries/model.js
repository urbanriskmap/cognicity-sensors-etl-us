import {Service} from '../../../services';
import request from 'request';
import Stations from '../../../library/data';

export class EtlData {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;
    this.stations = new Stations(this.config, new Service(this.config));
  }

  // TODO: move to index.js
  filterStations() {
    const conditions = [
      {
        type: 'hasProperty',
        values: ['stationId'],
      },
    ];

    return new Promise((resolve, reject) => {
      this.stations.filter(conditions, 'sfwmd', 'stationId')
      .then((list) => resolve(list))
      .catch((error) => reject(error));
    });
  }

  checkStoredObservations(sensorId, uid) {
    return new Promise((resolve, reject) => {
      this.stations.getStoredObservations('sfwmd', sensorId, 'timeseries')
      .then(({
        storedObservations,
        dataId,
      }) => {
        let lastUpdated;
        let hasStoredObs = false;

        if (storedObservations.length
          && storedObservations[storedObservations.length - 1]
          .hasOwnProperty('dateTime')
        ) {
          // process.env passes true / false values as strings
          lastUpdated = storedObservations[
            storedObservations.length - 1
          ].dateTime;
          hasStoredObs = true;
        }

        resolve({
          sensorId: sensorId, // 'id' property in metadata, 'sensorId' in data
          uid: uid, // 'stationId' property in metadata
          dataId: dataId ? dataId : null,
          lastUpdated: hasStoredObs ? lastUpdated : null,
        });
      })
      .catch((error) => reject(error));
    });
  }

  getWmdQueryTimeFormat() {
    const periodMilliseconds = parseInt(
      this.config.RECORDS_PERIOD.slice(2, -1),
      10
    ) * 24 * 60 * 60 * 1000;

    const now = Date.now();
    const start = Date.parse(now) - periodMilliseconds;

    const begin = start.getFullYear() + '-' + start.getMonth() + '-'
    + start.getDate() + start.getHours() + ':' + start.getMinutes() + ':00:000';

    const end = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate()
    + now.getHours() + ':' + now.getMinutes() + ':00:000';

    return {
      begin: begin,
      end: end,
    };
  }

  extractStationObservations(station) {
    const period = this.getWmdQueryTimeFormat();
    const sfwmdQuery = this.config.SFWMD_TIMESERIES_ENDPOINT
    + '&beginDateTime=' + period.begin
    + '&endDateTime=' + period.end
    + '&names=' + station.uid;

    const logMessage = {
      log: station.uid
      + ': Station is inactive or has no new observations in past '
      + this.config.RECORDS_INTERVAL.slice(2, -1) + ' minutes.',
    };

    return new Promise((resolve, reject) => {
      request.get({
        url: sfwmdQuery,
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (body.timeSeriesResponse.status.statusCode !== 0) {
          reject(body);
        } else {
          if (body.timeSeriesResponse.timeSeries.length) {
            resolve({
              storedProperties: station,
              sfwmdData: body.timeSeriesResponse.timeSeries,
            });
          } else {
            resolve(logMessage);
          }
        }
      });
    });
  }

  transform(data) {
    let observations;
    let transformedData;

    return new Promise((resolve, reject) => {
      if (data.hasOwnProperty('log')) {
        resolve(data);
      } else {
        const station = data.storedProperties;
        const stationData = data.sfwmdData;

        if (stationData.length
          && stationData[0].hasOwnProperty('values')
          && stationData[0].values.length
        ) {
          observations = stationData[0].values;
          transformedData = [];
          for (let observation of observations) {
            transformedData.push({
              dateTime: observation.dateTime,
              value: observation.value,
            });
          }
          resolve({
            sensorId: station.sensorId,
            dataId: station.dataId,
            data: transformedData,
            lastUpdated: station.lastUpdated,
          });
        } else {
          resolve({
            log: station.sensorId + ': No valid data available',
          });
        }
      }
    });
  }

  compareStationObservations(station) {
    const logMessage = {
      log: station.uid
      + ': Station has no new observations',
    };

    return new Promise((resolve, reject) => {
      if (station.hasOwnProperty('log')) {
        resolve(station);
      } else {
        if (!station.lastUpdated) {
          resolve(station);
        } else {
          let lastExtractedObservation;
          if (station.data.length
            && station.data[station.data.length - 1].hasOwnProperty('dateTime')
          ) {
            lastExtractedObservation = station.data[
              station.data.length - 1
            ].dateTime;
          }

          if (lastExtractedObservation === station.lastUpdated) {
            resolve(logMessage);
          } else {
            resolve(station);
          }
        }
      }
    });
  }

  // TODO: move to index.js
  loadObservations(station) {
    return new Promise((resolve, reject) => {
      this.sensors.loadObservations(station.sensorId, {
        type: 'timeseries',
        observations: station.data,
      }, 'station')
      .then((msg) => resolve(msg))
      .catch((error) => reject(error));
    });
  }
}
