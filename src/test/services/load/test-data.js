export default {
  baseUrl: 'https://some.base.url/',
  apiKey: 'someApiKey',

  sensorMetadata: {
    'properties': {
      'uid': '260536080302501',
      'type': 'ST',
      'class': '00065',
      'units': 'ft',
      'agency': 'usgs',
    },
  },

  successResponse: () => {
    return {
      'statusCode': 200,
      'result': {
        'features': [
          {
            'properties': {
              'id': '56',
              'created': '2018-06-19T20:32:52.230Z',
              'properties': {
                'uid': '260536080302501',
                'type': 'ST',
                'class': '00065',
                'units': 'ft',
                'agency': 'usgs',
              },
            },
          },
        ],
      },
    };
  },

  errorResponse: () => {
    return {
      statusCode: 400,
      result: 'Incompatible sensor format',
    };
  },

  noIdResponse: () => {
    return {
      statusCode: 200,
      result: {
        features: [
          {
            properties: {
              noIdKey: 'foo',
            },
          },
        ],
      },
    };
  },
};
