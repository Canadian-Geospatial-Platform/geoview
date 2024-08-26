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

export const CONFIG_FILES_LIST: ConfigFileResource[] = [
  { filePath: 'navigator/01-basemap-LCC-TLS.json', label: 'Basemap LCC Transport-Labeled-Shaded', group: 'Basemaps' },
  { filePath: 'navigator/02-basemap-LCC-SL.json', label: 'Basemap LCC Simple-Labeled (overview map hide on zoom 7 and lower)' },
  { filePath: 'navigator/03-projection-WM.json', label: 'Basemap WM' },
  { filePath: 'navigator/04-restrict-zoom.json', label: 'Restricted zoom [4, 8]' },
  { filePath: 'navigator/05-zoom-layer.json', label: 'Zoom on layer extent' },
  { filePath: 'navigator/06-basic-footer.json', label: 'Basic map with footer' },
  { filePath: 'navigator/07-basic-appbar.json', label: 'Basic map with app bar' },
  { filePath: 'navigator/26-package-area-of-interest.json', label: 'Package Area of interest' },
  { filePath: 'navigator/08-package-basemap.json', label: 'Package basemap panel' },
  { filePath: 'navigator/09-package-basemap-custom.json', label: 'Package custom basemap panel' },
  { filePath: 'navigator/10-package-time-slider.json', label: 'Package time slider' },
  { filePath: 'navigator/11-package-time-slider-custom.json', label: 'Package custom time slider' },
  { filePath: 'navigator/12-package-geochart.json', label: 'Package geochart' },
  { filePath: 'navigator/12-a-package-swiper.json', label: 'Package swiper' },
  { filePath: 'navigator/13-all-layers.json', label: 'All Layer Types' },
  { filePath: 'navigator/14-wms-layer.json', label: 'Layer - WMS -' },
  { filePath: 'navigator/15-xyz-tile.json', label: 'Layer - XYZ Tile -' },
  { filePath: 'navigator/16-esri-dynamic.json', label: 'Layer - ESRI Dynamic -' },
  { filePath: 'navigator/17-esri-feature.json', label: 'Layer - ESRI Feature -' },
  { filePath: 'navigator/18-esri-image.json', label: 'Layer - ESRI Image -' },
  { filePath: 'navigator/19-geojson.json', label: 'Layer - GeoJSON -' },
  { filePath: 'navigator/20-wfs.json', label: 'Layer - WFS -' },
  { filePath: 'navigator/21-ogc-feature-api.json', label: 'Layer - OGC Feature API -' },
  { filePath: 'navigator/22-static-image.json', label: 'Layer - Static Image -' },
  { filePath: 'navigator/23-csv.json', label: 'Layer - CSV -' },
  { filePath: 'navigator/24-vector-tile.json', label: 'Layer - Vector Tile -' },
  { filePath: 'navigator/25-geojson-multi.json', label: 'Layer - GeoJSON MutiPolygon -' },
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
