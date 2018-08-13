export default {
  getSensorsNoArgs() {
    return {
      result: {
        features: [
          {
            properties: {
              id: 3,
              properties: {
                uniqueIdKey: 'uniqueId',
                agency: 'someAgency',
              },
            },
          },
          {
            properties: {
              id: 5,
              noProperties: 'foo',
            },
          },
          {
            properties: {
              id: 7,
              properties: {
                noUniqueIdKey: 'foo',
                agency: 'someAgency',
              },
            },
          },
        ],
      },
    };
  },
};
