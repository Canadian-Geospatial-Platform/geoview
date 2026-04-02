import type { FitOptions } from 'ol/View';
/** Repository URL for GitHub. */
export declare const GITHUB_REPO = "https://github.com/Canadian-Geospatial-Platform/geoview";
/** Geo URL and display text. */
export declare const GEO_URL_TEXT: {
    url: string;
    text: string;
};
/** OpenLayers zoom animation duration in milliseconds. */
export declare const OL_ZOOM_DURATION: number;
/** OpenLayers default maximum zoom level. */
export declare const OL_ZOOM_MAXZOOM: number;
/** OpenLayers zoom padding values [top, right, bottom, left]. */
export declare const OL_ZOOM_PADDING: [number, number, number, number];
/** Default OpenLayers fit options combining padding, max zoom, and duration. */
export declare const DEFAULT_OL_FITOPTIONS: FitOptions;
/** The north pole position used for north arrow marker and rotation angle. */
export declare const NORTH_POLE_POSITION: [number, number];
/** Overview map widget dimensions. */
export declare const OL_OVERVIEWMAP_SIZE: {
    width: string;
    height: string;
};
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