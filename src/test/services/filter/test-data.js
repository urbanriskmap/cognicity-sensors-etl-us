export default {
  baseUrl: 'https://some.base.url/',

  mockResponse_1: {
    'statusCode': 400,
    'result': 'Internal server error',
  },

  mockResponse_2: {
    'statusCode': 200,
    'result': [],
  },

  mockResponse_3: {
    'statusCode': 200,
    'result': {
      'type': 'FeatureCollection',
      'features': [],
    },
  },

  mockResponse_4: {
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
          'properties': {},
        },
      ],
    },
  },

  filterConditions: [
    {
      type: 'hasProperty',
      values: ['uid'],
    },
    {
      type: 'hasProperty',
      values: ['agency'],
    },
    {
      type: 'equate',
      values: [
        {
          type: 'property',
          value: 'agency',
        },
        {
          type: 'value',
          value: 'usgs',
        },
      ],
    },
    {
      type: 'hasProperty',
      values: ['class'],
    },
    {
      type: 'equate',
      values: [
        {
          type: 'property',
          value: 'class',
        },
        {
          type: 'value',
          value: '00065',
        },
      ],
    },
  ],

  mockResponse_5: {
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
            'id': '1',
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
            'id': '2',
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
              -80.83034079,
              26.26230464,
            ],
          },
          'properties': {
            'id': '3',
            'created': '2018-10-01T20:57:55.346Z',
            'properties': {
              'uid': '261543080495000',
              'type': 'ST-CA',
              'class': '00060',
              'units': 'ft3/s',
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
            'id': '4',
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
  },

  incompatibleCondition_1: [
    // incompatible condition type
    {
      type: 'foo',
      values: ['bar'],
    },
  ],

  incompatibleCondition_2: [
    // incompatible equate value type
    {
      type: 'equate',
      values: [
        {
          type: 'foo',
          value: 'bar',
        },
      ],
    },
  ],

  incompatibleCondition_3: [
    // equate values !== 2
    {
      type: 'equate',
      values: [
        {
          type: 'property',
          value: 'class',
        },
      ],
    },
  ],
};
