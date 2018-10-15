export default {
  // Erroneous, with child property
  mockData_1: {
    upstream: [
      {},
      {},
      {},
    ],
  },

  // Erroneous, without child property
  mockData_2: [
    {},
    {},
    {},
  ],

  // With child property
  mockData_3: {
    upstream: [
      {dateTime: '2018-10-14T12:00:00.000Z', value: '1.00'},
      {dateTime: '2018-10-14T13:00:00.000Z', value: '2.00'},
      {dateTime: '2018-10-14T14:00:00.000Z', value: '3.00'},
    ],
  },

  // Without child property
  mockData_4: [
    {dateTime: '2018-10-14T12:00:00.000Z', value: '1.00'},
    {dateTime: '2018-10-14T13:00:00.000Z', value: '2.00'},
    {dateTime: '2018-10-14T14:00:00.000Z', value: '3.00'},
  ],
};
