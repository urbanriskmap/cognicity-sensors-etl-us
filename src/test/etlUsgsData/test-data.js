export default {
  getSensorsNoArgs() {
    return {
      body: {
        features: [
          {
            properties: {
              id: 5,
              properties: {
                uid: 'uniqueId',
                class: 'sensorCode',
              },
            },
          },
          {
            properties: {
              id: 6,
              otherProperty: 'foo',
            },
          },
          {
            properties: {
              id: 7,
              properties: {
                noUid: 'foo',
              },
            },
          },
          {
            properties: {
              id: 8,
              properties: {
                uid: 'foo',
                class: 'foo',
              },
            },
          },
        ],
      },
    };
  },

  getDataWithObs() {
    return {
      body: [
        {
          id: 23,
          sensor_id: 5,
          properties: {
            observations: {
              upstream: [
                {
                  dateTime: 'firstDateTime',
                  value: 'up_v1',
                },
                {
                  dateTime: 'secondDateTime',
                  value: 'up_v2',
                },
                {
                  dateTime: 'lastDateTime',
                  value: 'up_v3',
                },
              ],
              downstream: [
                {
                  dateTime: 'firstDateTime',
                  value: 'down_v1',
                },
                {
                  dateTime: 'secondDateTime',
                  value: 'down_v2',
                },
                {
                  dateTime: 'lastDateTime',
                  value: 'down_v3',
                },
              ],
            },
          },
        },
      ],
    };
  },

  getDataNoObs() {
    return {
      body: [
        {
          id: 27,
          sensor_id: 3,
          properties: {
            observations: {
              upstream: [],
              downstream: [],
            },
          },
        },
      ],
    };
  },
};
