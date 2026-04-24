import type { FitOptions } from 'ol/View';

/** Repository URL for GitHub. */
export const GITHUB_REPO = 'https://github.com/Canadian-Geospatial-Platform/geoview';

/** Geo URL and display text. */
export const GEO_URL_TEXT = {
  url: 'https://geo.ca/',
  text: 'Geo.ca',
};

/** OpenLayers zoom animation duration in milliseconds. */
export const OL_ZOOM_DURATION: number = 500;
/** OpenLayers default maximum zoom level. */
export const OL_ZOOM_MAXZOOM: number = 13;
/** OpenLayers zoom padding values [top, right, bottom, left]. */
export const OL_ZOOM_PADDING: [number, number, number, number] = [100, 100, 100, 100];
/** Default OpenLayers fit options combining padding, max zoom, and duration. */
export const DEFAULT_OL_FITOPTIONS: FitOptions = {
  padding: OL_ZOOM_PADDING,
  maxZoom: OL_ZOOM_MAXZOOM,
  duration: OL_ZOOM_DURATION,
};

/** The north pole position used for north arrow marker and rotation angle. */
// NOTE: north value (set longitude to be half of Canada extent (142° W, 52° W)) - projection central meridian is -95
export const NORTH_POLE_POSITION_LONLAT: [number, number] = [90, -95];

/** Overview map widget dimensions. */
export const OL_OVERVIEWMAP_SIZE = {
  width: '150px',
  height: '150px',
};

/** Layer lifecycle status values. */
export const LAYER_STATUS = {
  NEW_INSTANCE: 'newInstance',
  REGISTERED: 'registered',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
} as const;

/** Feature info request status values. */
export const FEATURE_INFO_STATUS = {
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  ERROR: 'error',
} as const;

/** Arrow key codes for keyboard navigation. */
export const ARROW_KEY_CODES: string[] = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLefts'];
/** Arrow key codes plus Space for keyboard navigation. */
export const ARROW_KEYS_WITH_SPACE: string[] = [...ARROW_KEY_CODES, 'Space'];

/** Tab identifier constants for footer panel sections. */
export const TABS = {
  LEGEND: 'legend',
  DETAILS: 'details',
  LAYERS: 'layers',
  DATA_TABLE: 'data-table',
  GUIDE: 'guide',
  TIME_SLIDER: 'time-slider',
  GEO_CHART: 'geochart',
} as const;

/** Numeric filter operator mappings for OGC queries. */
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

/** Date filter operator mappings for OGC queries. */
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

/** String filter operator mappings for OGC queries. */
export const STRING_FILTER: Record<string, string> = {
  contains: `filterId like '%value%'`,
  startsWith: `filterId like 'value%'`,
  endsWith: `filterId like '%value'`,
  empty: 'filterId is null',
  notEmpty: 'filterId is not null',
  equals: `filterId = 'value'`,
  notEquals: `filterId <> 'value'`,
};

/** Container type identifiers for app bar and footer bar. */
export const CONTAINER_TYPE = {
  APP_BAR: 'appBar',
  FOOTER_BAR: 'footerBar',
} as const;

/** Timeout duration constants in milliseconds for various UI and async operations. */
export const TIMEOUT: Record<string, number> = {
  deferExecution: 0,
  focusDelay: 0,

  dataPanelLoading: 100,
  interactionFocusText: 100,
  guideSearchVisibility: 100,

  guideReturnFocus: 200,
  exportPreview: 200,
  topLinkFocusDelay: 200,

  focusDelayLightbox: 250,
  guideSearchSectionExpand: 300,

  fadingPanelDuration: 300, // Duration for fade-out and fade-in halves (ms) when crossfading between e.g. details and settings views

  modalFocusClose: 500,
  notification: 1000,
  northPoleVisibility: 1000,

  deleteLayerUndoWindow: 2500,

  delayBeforeShowingSlowCoordinateInfoWarning: 3000,

  featureHighlight: 5000,

  geolocationReturn: 10000,
  deleteLayerLoading: 10000,
};

/** File extensions recognized by GeoView for file-based layer URLs (used in validation, type guessing, and file upload). */
export const VALID_FILE_EXTENSIONS = ['.json', '.geojson', '.csv', '.kml', '.gpkg', '.tif', '.tiff', '.zip', '.shp', '.wkb'] as const;

/** Regex pattern matching URLs that end with a recognized file extension (case-insensitive, ignores query params). */
export const VALID_FILE_EXTENSIONS_REGEX = /(?:\.(geo)?json|\.csv|\.kml|\.gpkg|\.tiff?|\.zip|\.shp|\.wkb)$/i;

/** Comma-separated string of valid file extensions for use in file input `accept` attributes. */
export const VALID_FILE_EXTENSIONS_ACCEPT = VALID_FILE_EXTENSIONS.filter((ext) => ext !== '.tiff' && ext !== '.wkb').join(', ');

/**
 * Lightbox DOM selectors for yet-another-react-lightbox components.
 * ROOT: Use for state detection (checking if lightbox is open)
 * CONTAINER: Use for dimension calculations only
 */
export const LIGHTBOX_SELECTORS = {
  ROOT: '.yarl__root',
  CONTAINER: '.yarl__container',
  TOOLBAR: '.yarl__toolbar',
} as const;
