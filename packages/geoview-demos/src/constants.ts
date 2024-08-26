import _ from 'lodash';
import { ConfigFileResource, ListOptionType } from './types';

export const DEFAULT_DISPLAY_LANGUAGE = 'en';
export const DEFAULT_DISPLAY_THEME = 'geo.ca';
export const DEFAULT_DISPLAY_PROJECTION = 3978;
export const DEFAULT_MAP_WIDTH = 800;
export const DEFAULT_MAP_HEIGHT = 600;

export const DEFAULT_CONFIG = {
  map: {
    interaction: 'dynamic',
    viewSettings: {
      projection: 3978,
    },
    basemapOptions: {
      basemapId: 'transport',
      shaded: false,
      labeled: true,
    },
    listOfGeoviewLayerConfig: [
      {
        geoviewLayerId: 'wmsLYR1',
        geoviewLayerName: {
          en: 'earthquakes',
          fr: 'earthquakes',
        },
        metadataAccessPath: {
          en: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/earthquakes_en/MapServer/',
          fr: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/earthquakes_en/MapServer/',
        },
        geoviewLayerType: 'esriDynamic',
        listOfLayerEntryConfig: [
          {
            layerId: '0',
          },
        ],
      },
    ],
  },
  components: ['overview-map'],
  footerBar: {
    tabs: {
      core: ['legend', 'layers', 'details', 'data-table'],
    },
  },
  corePackages: [],
  theme: 'geo.ca',
};

export const CONFIG_FILES_LIST: ListOptionType[]= [
  { value: 'navigator/01-basemap-LCC-TLS.json', title: 'Basemap LCC Transport-Labeled-Shaded' },
  { value: 'navigator/02-basemap-LCC-SL.json', title: 'Basemap LCC Simple-Labeled (overview map hide on zoom 7 and lower)' },
  { value: 'navigator/03-projection-WM.json', title: 'Basemap WM' },
  { value: 'navigator/04-restrict-zoom.json', title: 'Restricted zoom [4, 8]' },
  { value: 'navigator/05-zoom-layer.json', title: 'Zoom on layer extent' },
  { value: 'navigator/06-basic-footer.json', title: 'Basic map with footer' },
  { value: 'navigator/07-basic-appbar.json', title: 'Basic map with app bar' },
  { value: 'navigator/26-package-area-of-interest.json', title: 'Package Area of interest' },
  { value: 'navigator/08-package-basemap.json', title: 'Package basemap panel' },
  { value: 'navigator/09-package-basemap-custom.json', title: 'Package custom basemap panel' },
  { value: 'navigator/10-package-time-slider.json', title: 'Package time slider' },
  { value: 'navigator/11-package-time-slider-custom.json', title: 'Package custom time slider' },
  { value: 'navigator/12-package-geochart.json', title: 'Package geochart' },
  { value: 'navigator/12-a-package-swiper.json', title: 'Package swiper' },
  { value: 'navigator/13-all-layers.json', title: 'All Layer Types' },
  { value: 'navigator/14-wms-layer.json', title: 'Layer - WMS -' },
  { value: 'navigator/15-xyz-tile.json', title: 'Layer - XYZ Tile -' },
  { value: 'navigator/16-esri-dynamic.json', title: 'Layer - ESRI Dynamic -' },
  { value: 'navigator/17-esri-feature.json', title: 'Layer - ESRI Feature -' },
  { value: 'navigator/18-esri-image.json', title: 'Layer - ESRI Image -' },
  { value: 'navigator/19-geojson.json', title: 'Layer - GeoJSON -' },
  { value: 'navigator/20-wfs.json', title: 'Layer - WFS -' },
  { value: 'navigator/21-ogc-feature-api.json', title: 'Layer - OGC Feature API -' },
  { value: 'navigator/22-static-image.json', title: 'Layer - Static Image -' },
  { value: 'navigator/23-csv.json', title: 'Layer - CSV -' },
  { value: 'navigator/24-vector-tile.json', title: 'Layer - Vector Tile -' },
  { value: 'navigator/25-geojson-multi.json', title: 'Layer - GeoJSON MutiPolygon -' },
];

export const basemapOptions: ListOptionType[] = [
  { title: 'Transport', value: 'transport' },
  { title: 'Simple', value: 'simple' },
  { title: 'World Map', value: 'world-map' }
];

export const mapProjectionOptions: ListOptionType[] = [
  { title: 'LCC', value: 3978 },
  { title: 'Web Mercator', value: 3857 }
];

export const mapInteractionOptions: ListOptionType[] = [
  { title: 'Static', value: 'static' },
  { title: 'Dynamic', value: 'dynamic' }
];


export const componentsOptions: ListOptionType[] = [
  { title: 'North Arrow', value: 'north-arrow' },
  { title: 'Overview Map', value: 'overview-map' }
];

export const footerTabslist: ListOptionType[] = [
  { title: 'Legend', value: 'legend' },
  { title: 'Layers', value: 'layers' },
  { title: 'Details', value: 'details' },
  { title: 'Data Table', value: 'data-table' }
];

export const appBarOptions: ListOptionType[] = [
  { title: 'Legend', value: 'legend' },
  { title: 'Layers', value: 'layers' },
  { title: 'Details', value: 'details' },
  { title: 'Data Table', value: 'data-table' },
  { title: 'Geolocator', value: 'geolocator' },
  { title: 'Export', value: 'export' }
];

export const navBarOptions: ListOptionType[] = [
  { title: 'Zoom', value: 'zoom' },
  { title: 'Fullscreen', value: 'fullscreen' },
  { title: 'Home', value: 'home' },
  { title: 'Location', value: 'location' },
  { title: 'Basemap Select', value: 'basemap-select' }
];

export const themeOptions: ListOptionType[] = [
  { title: 'geo.ca', value: 'geo.ca' },
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' }
];

export const languageOptions: ListOptionType[] = [
  { title: 'English', value: 'en' },
  { title: 'French', value: 'fr' }
];

export const zoomOptions: ListOptionType[] = _.range(0, 51).map((value) => ({ title: value.toString(), value }));
