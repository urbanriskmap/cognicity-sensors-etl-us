export default {
  getSensors() {
    return {
      'result': {
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
      'result': {
            'id': 5,
          },
      };
  },

  postSensorsError() {
    return new Error('Post sensors error');
  },
};
