export default {
  getStations() {
    return {
      result: {
        features: [
          {
            properties: {
              id: 3,
              properties: {
                agency: 'noaa',
                station: 8722956,
              },
            },
          },
          {
            properties: {
              id: 5,
              properties: {
                agency: 'noaa',
                foo: 'bar',
              },
            },
          },
          {
            properties: {
              id: 7,
              properties: {
                agency: 'usgs',
                uid: 'uniqueId',
              },
            },
          },
          {
            properties: {
              id: 9,
              properties: {
                agency: 'sfwmd',
                uid: 'S30-S-Q',
              },
            },
          },
        ],
      },
    };
  },

  stationToCompare() {
    return {
      properties: {
        agency: 'noaa',
        datum: 'MLLW',
        name: 'South Port Everglades',
        station: 8722956,
        time_zone: 'LST_LDT',
        units: 'ft',
      },
      location: {
        lat: 26.0817,
        lng: -80.1167,
      },
    };
  },
};
