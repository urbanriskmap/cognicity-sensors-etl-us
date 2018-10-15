export default {
  baseUrl: 'https://some.base.url/',

  mockResponse_1: {
    statusCode: 200,
    result: {},
  },

  mockResponse_2: {
    statusCode: 200,
    result: [
      {
        foo: 'bar',
      },
    ],
  },

  mockResponse_3: {
    statusCode: 200,
    result: [
      {
        dataId: 100,
        properties: {
          observations: [
            {dateTime: '2018-10-14T12:00:00.000Z', value: '1.00'},
            {dateTime: '2018-10-14T11:00:00.000Z', value: '2.00'},
          ],
        },
      },
      {
        dataId: 105,
        properties: {
          observations: [
            {dateTime: '2018-10-14T11:00:00.000Z', value: '2.00'},
            {dateTime: '2018-10-14T10:00:00.000Z', value: '3.00'},
          ],
        },
      },
    ],
  },
};
