export default {
  getSensorsNoArgs() {
    return {
      result: {
        features: [
          {
            properties: {
              id: 5,
              properties: {
                uniqueIdKey: 'uniqueId',
                class: 'sensorCode',
                agency: 'someAgency',
              },
            },
          },
          {
            properties: {
              id: 6,
              noProperties: 'foo',
            },
          },
          {
            properties: {
              id: 7,
              properties: {
                noUid: 'foo',
                agency: 'someAgency',
              },
            },
          },
          {
            properties: {
              id: 8,
              properties: {
                uniqueIdKey: 'foo',
                class: 'otherClass',
                agency: 'someAgency',
              },
            },
          },
        ],
      },
    };
  },

  getDataWithObs() {
    return {
      result: [
        {
          dataId: 23,
          sensorId: 5,
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
      result: [
        {
          dataId: 27,
          sensorId: 3,
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
