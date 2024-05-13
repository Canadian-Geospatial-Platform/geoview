// Repositry URL for GitHub
export const GITHUB_REPO = 'https://github.com/Canadian-Geospatial-Platform/geoview';

// Geo URL
export const GEO_URL_TEXT = {
  url: 'https://geo.ca/',
  text: 'Geo.ca',
};

// OpenLayer constants
export const OL_ZOOM_DURATION = 500;

// The north pole position use for north arrow marker and get north arrow rotation angle
// north value (set longitude to be half of Canada extent (142° W, 52° W)) - projection central meridian is -95
export const NORTH_POLE_POSITION: [number, number] = [90, -95];

export const OL_ZOOM_PADDING: [number, number, number, number] = [100, 100, 100, 100];

export const OL_OVERVIEWMAP_SIZE = {
  width: '150px',
  height: '150px',
};

export const LAYER_STATUS = {
  NEW_INSTANCE: 'newInstance',
  PROCESSING: 'processing',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
} as const;

export const VECTOR_LAYER = { csv: '', esriFeature: '', GeoJSON: '', GeoPackage: '', ogcFeature: '', ogcWfs: '' };

export const ARROW_KEY_CODES: string[] = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLefts'];
export const ARROW_KEYS_WITH_SPACE: string[] = [...ARROW_KEY_CODES, 'Space'];

export const TABS = {
  LEGEND: 'legend',
  DETAILS: 'details',
  LAYERS: 'layers',
  DATA_TABLE: 'data-table',
  GUIDE: 'guide',
  TIME_SLIDER: 'time-slider',
  GEO_CHART: 'geochart',
} as const;
