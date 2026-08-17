import type { FitOptions } from 'ol/View';
/** Repository URL for GitHub. */
export declare const GITHUB_REPO = "https://github.com/Canadian-Geospatial-Platform/geoview";
/** Geo URL and display text. */
export declare const GEO_URL_TEXT: {
    url: string;
    text: string;
};
/**
 * OpenLayers default maximum zoom level.
 * @deprecated Doesn't seem used anymore
 */
export declare const OL_ZOOM_MAXZOOM = 13;
/** OpenLayers zoom animation duration in milliseconds. */
export declare const OL_ZOOM_DURATION = 500;
/** OpenLayers zoom padding values as percentage of the map size dimensions [width, height] (both sides!). */
export declare const OL_ZOOM_PERCENT_PADDING: [number, number];
/** The extended FitOptions for Geoview. */
export type GVFitOptions = FitOptions & {
    percentPadding?: [number, number];
};
/** Default OpenLayers fit options combining padding, max zoom, and duration. */
export declare const DEFAULT_OL_GVFITOPTIONS: GVFitOptions;
/** The north pole position used for north arrow marker and rotation angle. */
export declare const NORTH_POLE_POSITION_LONLAT: [number, number];
/** Overview map widget dimensions. */
export declare const OL_OVERVIEWMAP_SIZE: {
    width: string;
    height: string;
};
/** Visual separation margin between overview map and nav bar (in pixels). */
export declare const OVERVIEW_MAP_NAV_BAR_MARGIN = 25;
/** Visual separation margin between map info bar and nav bar (in pixels). */
export declare const MAP_INFO_NAV_BAR_MARGIN = 8;
/** Top spacing added to nav bar when overview map is visible (overview height + visual separation margin). */
export declare const NAV_BAR_OVERVIEW_OFFSET: string;
/** Map info bar height when collapsed. */
export declare const MAP_INFO_HEIGHT_COLLAPSED = "40px";
/** Map info bar height when expanded. */
export declare const MAP_INFO_HEIGHT_EXPANDED = "80px";
/** Bottom spacing for nav bar when map info is collapsed (map-info height + margin). */
export declare const NAV_BAR_BOTTOM_OFFSET = "calc(40px + 8px)";
/** Bottom spacing for nav bar when map info is expanded (expanded map-info height + margin). */
export declare const NAV_BAR_BOTTOM_OFFSET_EXPANDED = "calc(80px + 8px)";
/** Maximum height for navbar button groups in multi-column layout. */
export declare const NAV_BAR_BUTTON_GROUP_MAX_HEIGHT = "340px";
/**
 * Minimum map container width (in pixels) required to render overview map.
 *
 * Measured via ResizeObserver on the actual map container element (mapTargetElement), NOT the browser viewport.
 */
export declare const OVERVIEW_MAP_MIN_CONTAINER_WIDTH = 700;
/**
 * Minimum map container height (in pixels) required to render overview map.
 *
 * Measured via ResizeObserver on the actual map container element (mapTargetElement), NOT the browser viewport.
 * Below this threshold, the overview map would crowd the interface vertically.
 * Breakdown: overview map (150px) + info bar (40px or 80px) + Room for navBar and spacing (balance).
 */
export declare const OVERVIEW_MAP_MIN_CONTAINER_HEIGHT = 361;
/** Layer lifecycle status values. */
export declare const LAYER_STATUS: {
    readonly NEW_INSTANCE: "newInstance";
    readonly REGISTERED: "registered";
    readonly PROCESSING: "processing";
    readonly PROCESSED: "processed";
    readonly LOADING: "loading";
    readonly LOADED: "loaded";
    readonly ERROR: "error";
};
/** Feature info request status values. */
export declare const FEATURE_INFO_STATUS: {
    readonly PROCESSING: "processing";
    readonly PROCESSED: "processed";
    readonly ERROR: "error";
};
/** Arrow key codes for keyboard navigation. */
export declare const ARROW_KEY_CODES: string[];
/** Arrow key codes plus Space for keyboard navigation. */
export declare const ARROW_KEYS_WITH_SPACE: string[];
/** Tab identifier constants for footer panel sections. */
export declare const TABS: {
    readonly LEGEND: "legend";
    readonly DETAILS: "details";
    readonly LAYERS: "layers";
    readonly DATA_TABLE: "data-table";
    readonly GUIDE: "guide";
    readonly TIME_SLIDER: "time-slider";
    readonly GEO_CHART: "geochart";
};
/** Numeric filter operator mappings for OGC queries. */
export declare const NUMBER_FILTER: Record<string, string>;
/** Date filter operator mappings for OGC queries. */
export declare const DATE_FILTER: Record<string, string>;
/** String filter operator mappings for OGC queries. */
export declare const STRING_FILTER: Record<string, string>;
/** Container type identifiers for app bar and footer bar. */
export declare const CONTAINER_TYPE: {
    readonly APP_BAR: "appBar";
    readonly FOOTER_BAR: "footerBar";
};
/** Timeout duration constants in milliseconds for various UI and async operations. */
export declare const TIMEOUT: Record<string, number>;
/** File extensions recognized by GeoView for file-based layer URLs (used in validation, type guessing, and file upload). */
export declare const VALID_FILE_EXTENSIONS: readonly [".json", ".geojson", ".csv", ".kml", ".gpkg", ".tif", ".tiff", ".zip", ".shp", ".wkb"];
/** Regex pattern matching URLs that end with a recognized file extension (case-insensitive, ignores query params). */
export declare const VALID_FILE_EXTENSIONS_REGEX: RegExp;
/** Comma-separated string of valid file extensions for use in file input `accept` attributes. */
export declare const VALID_FILE_EXTENSIONS_ACCEPT: string;
/**
 * Lightbox DOM selectors for yet-another-react-lightbox components.
 * ROOT: Use for state detection (checking if lightbox is open)
 * CONTAINER: Use for dimension calculations only
 */
export declare const LIGHTBOX_SELECTORS: {
    readonly ROOT: ".yarl__root";
    readonly CONTAINER: ".yarl__container";
    readonly TOOLBAR: ".yarl__toolbar";
};
//# sourceMappingURL=constant.d.ts.map