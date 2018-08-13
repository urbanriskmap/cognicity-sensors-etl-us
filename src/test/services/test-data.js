export default {
  getSensorsWithAgency() {
    return {
      result: {
        features: [
          {
            properties: {
              properties: {
                uid: 'uniqueId',
              },
            },
          },
        ],
      },
    };
  },

  getSensorsWithId() {
    return {
      result: [
        {
          dataId: '100',
          sensorId: '42',
          properties: {
            type: 'timeseries',
          },
        },
        {
          dataId: '200',
          sensorId: '42',
          properties: {
            type: 'aggregate',
          },
        },
      ],
    };
  },

  getSensorsWithType() {
    return {
      result: [
        {
          dataId: '300',
          sensorId: '52',
          properties: {
            type: 'timeseries',
            observations: [
              {
                value: 5,
                dateTime: '2018-08-12T20:20:00:000',
              },
            ],
          },
        },
      ],
    };
  },

  getSensorsError() {
    return new Error('Get sensors error');
  },

  postSensors() {
    return {
      statusCode: 200,
      result: {
            id: 5,
          },
      };
  },

  postSensorsError() {
    return new Error('Post sensors error');
  },
};
