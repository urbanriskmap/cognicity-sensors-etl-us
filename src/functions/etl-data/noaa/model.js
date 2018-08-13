import request from 'request';

import HttpService from '../../../services/http.service';
import DataService from '../../../services/data.service';
import TimeService from '../../../services/time.service';

export class EtlData {
  constructor(config) {
    this.config = config;
    request.debug = this.config.DEBUG_HTTP_REQUESTS;

    this.dataService = new DataService(
      this.config, new HttpService(this.config)
    );
    this.timeService = new TimeService(this.config);
  }

  filterStations() {
    const conditions = [
      {
        type: 'hasProperty',
        values: [this.config.SENSOR_UID_PROPERTY],
      },
    ];

    return new Promise((resolve, reject) => {
      this.dataService.filter(conditions)
      .then((list) => resolve(list))
      .catch((error) => reject(error));
    });
  }

  checkStoredObservations(id, uid) {
    return new Promise((resolve, reject) => {
      this.dataService.getStoredObservations(id)
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
          uid: uid, // 'station' property in metadata
          dataId: dataId ? dataId : null,
          lastUpdated: hasStoredObs ? lastUpdated : null,
        });
      })
      .catch((error) => reject(error));
    });
  }

  extractStationObservations(station) {
    const period = this.timeService.getNoaaQueryTimeFormat();
    let endDate;
    if (this.config.NOAA_PRODUCT === 'water_level') {
      endDate = period.now;
    } else if (this.confign.NOAA_PRODUCT === 'predictions') {
      endDate = period.end;
    }

    const noaaQuery = this.config.NOAA_ENDPOINT
    + '&product=' + this.config.NOAA_PRODUCT
    + '&begin_date=' + period.begin
    + '&end_date=' + endDate
    + '&station=' + station.station
    + '&datum=' + station.datum
    + '&time_zone=' + station.time_zone;

    const logMessage = {
      log: station.uid
      + ': Station is inactive or has no new observations in past '
      + this.config.RECORDS_INTERVAL.slice(2, -1) + ' minutes.',
    };

    return new Promise((resolve, reject) => {
      request.get({
        url: noaaQuery,
        json: true,
      }, (error, response, body) => {
        if (error) {
          resolve({log: error});
        } else {
          if (body && body.data && body.data.length) {
            resolve({
              storedProperties: station,
              noaaStationData: body.data,
            });
          } else {
            resolve(logMessage);
          }
        }
      });
    });
  }

  transform(data) {
    let transformedData;

    return new Promise((resolve, reject) => {
      if (data.hasOwnProperty('log')) {
        resolve(data);
      } else {
        const station = data.storedProperties;
        const stationData = data.noaaStationData;

        if (stationData
        && stationData.length) {
          transformedData = [];
          for (const observation of stationData) {
            const dateTime = new Date(observation.t);
            transformedData.push({
              dateTime: dateTime.toISOString(),
              value: observation.v,
            });
          }

          resolve({
            id: station.id,
            dataId: station.dataId,
            data: transformedData,
            lastUpdated: station.lastUpdated,
          });
        } else {
          resolve({
            log: station.id + ': No valid data available',
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

  loadObservations(station) {
    return new Promise((resolve, reject) => {
      if (station.hasOwnProperty('log')) {
        resolve(station);
      } else {
        this.dataService.loadObservations(station, {
          type: this.config.DATA_TYPE,
          observations: station.data,
        }, 'station')
        .then((msg) => resolve(msg))
        .catch((error) => reject(error));
      }
    });
  }
}
