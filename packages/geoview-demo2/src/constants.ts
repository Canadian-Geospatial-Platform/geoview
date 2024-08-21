
export const DEFAULT_DISPLAY_LANGUAGE = 'en';
export const DEFAULT_DISPLAY_THEME = 'geo.ca';
export const DEFAULT_DISPLAY_PROJECTION = 3978;
export const DEFAULT_MAP_WIDTH = 800;
export const DEFAULT_MAP_HEIGHT = 600;

export const DEFAULT_CONFIG = {
  'map': {
    'interaction': 'dynamic',
    'viewSettings': {
      'projection': 3978
    },
    'basemapOptions': {
      'basemapId': 'transport',
      'shaded': false,
      'labeled': true
    },
    'listOfGeoviewLayerConfig': [{
      'geoviewLayerId': 'wmsLYR1',
      'geoviewLayerName': {
        'en': 'earthquakes',
        'fr': 'earthquakes'
      },
      'metadataAccessPath': {
        'en': 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/earthquakes_en/MapServer/',
        'fr': 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/earthquakes_en/MapServer/'
      },
      'geoviewLayerType': 'esriDynamic',
      'listOfLayerEntryConfig': [
        {
          'layerId': '0'
        }
      ]
    }]
  },
  'components': ['overview-map'],
  'footerBar': {
    'tabs': {
      'core': ['legend', 'layers', 'details', 'data-table']
    }
  },
  'corePackages': [],
  'theme': 'geo.ca'
};