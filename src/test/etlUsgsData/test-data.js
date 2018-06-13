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
                agency: 'usgs',
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
                agency: 'usgs',
              },
            },
          },
          {
            properties: {
              id: 8,
              properties: {
                uid: 'foo',
                class: 'foo',
                agency: 'usgs',
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

  getUsgsObs(hasUpDownStream) {
    if (hasUpDownStream) {
      return {
        value: {
          timeSeries: [
            {
              values: [
                {
                  value: [
                    {
                      value: 3.1,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'upstream_1',
                    },
                    {
                      value: 3.3,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'upstream_2',
                    },
                  ],
                },
                {
                  value: [
                    {
                      value: 2.9,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'downstream_1',
                    },
                    {
                      value: 3.0,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'downstream_2',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };
    } else {
      return {
        value: {
          timeSeries: [
            {
              values: [
                {
                  value: [
                    {
                      value: 4.0,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'dateTime_1',
                    },
                    {
                      value: 4.2,
                      qualifiers: [
                        'P',
                      ],
                      dateTime: 'dateTime_2',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };
    }
  },
};
