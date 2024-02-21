// Repositry URL for GitHub
export const GITHUB_REPO = 'https://github.com/Canadian-Geospatial-Platform/geoview';

// Geo URL
export const GEO_URL_TEXT = {
  url: 'https://geo.ca/',
  text: 'Geo.ca',
};

/** The default geocore url */
export const CONFIG_GEOCORE_URL = 'https://geocore-stage.api.geo.ca';

/** The default geolocator url */
export const CONFIG_GEOLOCATOR_URL = 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate';

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

export const ARROW_KEY_CODES: string[] = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLefts'];
export const ARROW_KEYS_WITH_SPACE: string[] = [...ARROW_KEY_CODES, 'Space'];
