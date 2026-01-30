import type { FitOptions } from 'ol/View';

// Repositry URL for GitHub
export const GITHUB_REPO = 'https://github.com/Canadian-Geospatial-Platform/geoview';

// Geo URL
export const GEO_URL_TEXT = {
  url: 'https://geo.ca/',
  text: 'Geo.ca',
};

// OpenLayer constants
export const OL_ZOOM_DURATION: number = 500;
export const OL_ZOOM_MAXZOOM: number = 13;
export const OL_ZOOM_PADDING: [number, number, number, number] = [100, 100, 100, 100];
export const DEFAULT_OL_FITOPTIONS: FitOptions = {
  padding: OL_ZOOM_PADDING,
  maxZoom: OL_ZOOM_MAXZOOM,
  duration: OL_ZOOM_DURATION,
};

// The north pole position use for north arrow marker and get north arrow rotation angle
// north value (set longitude to be half of Canada extent (142° W, 52° W)) - projection central meridian is -95
export const NORTH_POLE_POSITION: [number, number] = [90, -95];

export const OL_OVERVIEWMAP_SIZE = {
  width: '150px',
  height: '150px',
};

export const LAYER_STATUS = {
  NEW_INSTANCE: 'newInstance',
  REGISTERED: 'registered',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
} as const;

export const FEATURE_INFO_STATUS = {
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  ERROR: 'error',
} as const;

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

export const NUMBER_FILTER: Record<string, string> = {
  lessThanOrEqualTo: '<=',
  lessThan: '<',
  greaterThan: '>',
  greaterThanOrEqualTo: '>=',
  empty: 'is null',
  notEmpty: 'is not null',
  between: '>',
  betweenInclusive: '>=',
  equals: '=',
  notEquals: '<>',
};

export const DATE_FILTER: Record<string, string> = {
  greaterThan: `> date 'value'`,
  greaterThanOrEqualTo: `>= date 'value'`,
  lessThan: `< date 'value'`,
  lessThanOrEqualTo: `<= date 'value'`,
  equals: `= date 'value'`,
  empty: 'is null',
  notEmpty: 'is not null',
  notEquals: `<> date 'value'`,
  between: `> date 'value'`,
  betweenInclusive: `>= date 'value'`,
};

export const STRING_FILTER: Record<string, string> = {
  contains: `filterId like '%value%'`,
  startsWith: `filterId like 'value%'`,
  endsWith: `filterId like '%value'`,
  empty: 'filterId is null',
  notEmpty: 'filterId is not null',
  equals: `filterId = 'value'`,
  notEquals: `filterId <> 'value'`,
};

export const CONTAINER_TYPE = {
  APP_BAR: 'appBar',
  FOOTER_BAR: 'footerBar',
} as const;

export const TIMEOUT: Record<string, number> = {
  deferExecution: 0,
  focusDelay: 0,

  dataPanelLoading: 100,
  handleEsc: 100,
  interactionFocusText: 100,
  guideSearchVisibility: 100,

  guideReturnFocus: 200,
  exportPreview: 200,

  focusDelayLightbox: 250,
  guideSearchSectionExpand: 300,
  modalFocusClose: 500,
  projectionSwitchRepeatQuery: 1000,
  notification: 1000,

  featureHighlight: 5000,
  geolocationReturn: 10000,
  deleteLayerLoading: 10000,
};
