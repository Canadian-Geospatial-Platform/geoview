
import { useEffect } from "react";

export default function RightPanel() {

  const createMap = () => {
    cgpv.api.createMapFromConfig(
      'sandboxMap2',
      `{
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
          }`
    );

    // initialize cgpv and api events, a callback is optional, used if calling api's after the rendering is ready
    cgpv.init((mapId: string) => {
      // write some code ...
      console.log('mapId:', mapId);
    });
  };

  useEffect(() => {
    createMap();
  }, []);

  return (
    <div className="right-panel">
      
      <div id="sandboxMapContainer">
        <div id="sandboxMap2"></div>
      </div>
    </div>
  );
}

