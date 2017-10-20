export default {
  getSensors() {
    return {
      'body': {
        'features': [
          {
            'properties': {
              'properties': {
                'uid': 'uniqueId',
              },
            },
          },
        ],
      },
    };
  },

  getSensorsError() {
    return new Error('Get sensors error');
  },

  postSensors() {
    return {
      'statusCode': 200,
      'body': {
        'features': [
          {
            'properties': {
              'id': 5,
            },
          },
        ],
      },
    };
  },

  postSensorsError() {
    return new Error('Post sensors error');
  },
};
