import {Service} from '../../../../services';
import request from 'request';
import Stations from '../../../../library/data';

export class EtlData {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;
    this.stations = new Stations(this.config, new Service(this.config));
  }

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

  checkStoredObservations(id, uid) {
    return new Promise((resolve, reject) => {
      this.stations.getStoredObservations('sfwmd', id, this.config.DATA_TYPE)
      .then(({
        checksPassed,
        storedObservations,
        dataId,
      }) => {
        let lastUpdated;
        let hasStoredObs = false;

        if (checksPassed
          && storedObservations.length
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
          id: id, // 'id' property in metadata, 'sensorId' in data
          uid: uid, // 'stationId' property in metadata
          dataId: dataId ? dataId : null,
          lastUpdated: hasStoredObs ? lastUpdated : null,
        });
      })
      .catch((error) => reject(error));
    });
  }

  extractStationObservations(station) {
    const period = this.stations.getWmdQueryTimeFormat();
    const sfwmdQuery = this.config.SFWMD_AGGREGATE_ENDPOINT
    + '&beginDateTime=' + period.begin
    + '&endDateTime=' + period.end
    + '&stationId=' + station.uid;

    const logMessage = {
      log: station.uid
      + ': Station is inactive or has no new mean calculation in past '
      + this.config.RECORDS_INTERVAL.slice(2, -1) + ' hours.',
    };

    return new Promise((resolve, reject) => {
      request.get({
        url: sfwmdQuery,
        json: true,
      }, (error, response, body) => {
        if (error) {
          resolve({log: error});
        } else {
          if (body && body.list && body.list.length) {
            resolve({
              storedProperties: station,
              sfwmdData: body.list,
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

        observations = stationData;
        transformedData = [];
        for (let observation of observations) {
          transformedData.push({
            dateTime: observation.myPoint.timestamp,
            value: observation.myPoint.value,
          });
        }

        resolve({
          id: station.id,
          dataId: station.dataId,
          data: transformedData,
          lastUpdated: station.lastUpdated,
        });
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

  loadObservations(station) {
    return new Promise((resolve, reject) => {
      if (station.hasOwnProperty('log')) {
        resolve(station);
      } else {
        this.stations.loadObservations(station, {
          type: this.config.DATA_TYPE,
          observations: station.data,
        }, 'station')
        .then((msg) => resolve(msg))
        .catch((error) => reject(error));
      }
    });
  }
}
