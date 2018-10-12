export default {
  baseUrl: 'https://some.base.url/',

  mockResponse_1: {
    statusCode: 200,
    result: {
      features: [
        {
          properties: {
            id: 5,
          },
        },
      ],
    },
  },

  mockResponse_2: {
    statusCode: 200,
    result: {
      dataId: 500,
    },
  },

  mockResponse_3: {
    statusCode: 200,
    result: 'Incompatible format',
  },
};
