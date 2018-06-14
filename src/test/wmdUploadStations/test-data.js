export default {
  getStations() {
    return {
      result: {
        features: [
          {
            properties: {
              id: 3,
              properties: {
                agency: 'sfwmd',
                stationId: 'S9-H',
              },
            },
          },
          {
            properties: {
              id: 4,
              properties: {
                agency: 'sfwmd',
                stationId: 'S30-S-Q',
              },
            },
          },
          {
            properties: {
              id: 5,
              properties: {
                agency: 'usgs',
                uid: 'uniqueId',
              },
            },
          },
          {
            properties: {
              id: 6,
              properties: {
                agency: 'sfwmd',
                foo: 'bar',
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
        agency: 'sfwmd',
        basin: 'HILLS',
        class: 'H',
        site: 'S39',
        stationId: 'S39-H',
        units: 'ft NGVD29',
      },
      location: {
        lat: 26.35621417,
        long: -80.29775833,
      },
    };
  },
};
