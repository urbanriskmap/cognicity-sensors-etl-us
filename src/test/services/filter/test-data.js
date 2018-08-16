export default {
  baseUrl: 'https://some.base.url/',

  mockGetUsgsResponse: () => {
    return {
      'statusCode': 200,
      'result': {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [
                -80.5069444,
                26.09333333,
              ],
            },
            'properties': {
              'id': '3',
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
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [
                -80.1822689,
                26.01509033,
              ],
            },
            'properties': {
              'id': '23',
              'created': '2018-06-19T20:33:18.507Z',
              'properties': {
                'uid': '260053080105701',
                'type': 'GW',
                'class': '62610',
                'units': 'ft',
                'agency': 'usgs',
              },
            },
          },
        ],
      },
    };
  },

  mockGetSfwmdResponse: () => {
    return {
      'statusCode': 200,
      'result': {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [
                -80.29726111,
                26.35556722,
              ],
            },
            'properties': {
              'id': '114',
              'created': '2018-08-09T17:54:23.201Z',
              'properties': {
                'site': 'S39',
                'basin': 'HILLS',
                'class': 'T',
                'units': 'ft NGVD29',
                'agency': 'sfwmd',
                'stationId': 'S39-T',
                'controlElevation': 9,
              },
            },
          },
        ],
      },
    };
  },

  mockGetAllSensorsResponse: () => {
    const response = exports.default.mockGetUsgsResponse();
    const sfwmdSensors = exports.default.mockGetSfwmdResponse()
      .result.features;

    for (const sensor of sfwmdSensors) {
      response.result.features.push(sensor);
    }

    return response;
  },
};
