export default {
  baseUrl: 'https://some.base.url/',

  mockGetSensorsResponse: () => {
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
                -80.1167,
                26.0817,
              ],
            },
            'properties': {
              'id': '169',
              'created': '2018-08-14T17:37:21.019Z',
              'properties': {
                'name': 'South Port Everglades',
                'datum': 'MLLW',
                'units': 'ft',
                'agency': 'noaa',
                'station': 8722956,
                'time_zone': 'LST_LDT',
              },
            },
          },
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
};
