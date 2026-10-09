/** STAC collection metadata. */
export interface StacCollection {
  /** Collection identifier. */
  id: string;
  /** Collection title (bilingual when available). */
  title?: string;
  /** Collection description. */
  description?: string;
  /** Keywords/tags. */
  keywords?: string[];
  /** License identifier. */
  license?: string;
  /** Spatial and temporal extent. */
  extent?: {
    spatial?: { bbox?: number[][] };
    temporal?: { interval?: (string | null)[][] };
  };
  /** Links array. */
  links?: StacLink[];
}

/** STAC item metadata. */
export interface StacItem {
  /** Item type (always "Feature"). */
  type: 'Feature';
  /** Unique item identifier. */
  id: string;
  /** Item geometry (GeoJSON). */
  geometry: unknown;
  /** Bounding box [west, south, east, north]. */
  bbox?: number[];
  /** Item properties. */
  properties: {
    title?: string;
    description?: string;
    datetime?: string | null;
    start_datetime?: string;
    end_datetime?: string;
    created?: string;
    updated?: string;
    [key: string]: unknown;
  };
  /** Item assets. */
  assets?: Record<string, StacAsset>;
  /** Collection this item belongs to. */
  collection?: string;
  /** Links array. */
  links?: StacLink[];
}

/** STAC asset definition. */
export interface StacAsset {
  /** Asset URL. */
  href: string;
  /** Asset title. */
  title?: string;
  /** Asset description. */
  description?: string;
  /** Media type. */
  type?: string;
  /** Asset roles (e.g., "thumbnail", "overview", "data"). */
  roles?: string[];
}

/** STAC link. */
export interface StacLink {
  /** Link URL. */
  href: string;
  /** Link relation type. */
  rel: string;
  /** Media type. */
  type?: string;
  /** Link title. */
  title?: string;
  /** HTTP method to use when following the link (pagination links of POST /search). */
  method?: 'GET' | 'POST';
  /** Request body to send when following a POST link. */
  body?: Record<string, unknown>;
  /** Whether the link body must be merged with the previous request body. */
  merge?: boolean;
}

/** STAC API sort criterion. */
export interface StacSortBy {
  /** The field to sort on (e.g., "datetime", "properties.scale"). */
  field: string;
  /** The sort direction. */
  direction: 'asc' | 'desc';
}

/** A queryable property from a STAC API queryables document. */
export interface StacQueryableField {
  /** Human-readable field title, when provided. */
  title?: string;
  /** JSON Schema property type. */
  type?: string;
  /** JSON Schema property format. */
  format?: string;
  /** Allowed values for enum queryables. */
  enum?: unknown[];
}

/** One queryable property to expose as a filter. */
export interface StacPropertyFilterConfig {
  /** Queryable field name from the server document. */
  field: string;
  /** Optional UI label overriding the server title. */
  label?: string;
}

/** Properties in a STAC API queryables document. */
export interface StacQueryables {
  /** Queryable property definitions, keyed by the STAC property name. */
  properties?: Record<string, StacQueryableField>;
}

/** One CQL2 JSON predicate. */
export interface StacCql2Expression {
  /** CQL2 operator. */
  op: string;
  /** Predicate operands. */
  args: (StacCql2Expression | { property: string } | string | number | boolean)[];
}

/** Style options for STAC extent footprints drawn on the map. */
export interface StacFootprintStyleConfig {
  /** Stroke and fill color. */
  color?: string;
  /** Fill opacity from 0 (transparent) to 1 (opaque). */
  fillOpacity?: number;
}

/** Footprint styles for collection extents and search results. */
export interface StacFootprintStylesConfig {
  /** Style for the aggregate extent shown while browsing a collection. */
  collection?: StacFootprintStyleConfig;
  /** Style for item footprints shown in search results. */
  search?: StacFootprintStyleConfig;
}

/** Per-collection display overrides. */
export interface StacCollectionOverride {
  /** Collection-specific item title, summary, and metadata fields. */
  itemView?: StacItemViewConfig;
  /** Collection-specific preview settings. */
  preview?: StacPreviewConfig;
  /** Collection-specific item actions. */
  actions?: StacActionsConfig;
  /** Collection-specific map footprint styles. */
  footprintStyles?: StacFootprintStylesConfig;
}

/** STAC API landing page (only the parts used by the browser). */
export interface StacLandingPage {
  /** Conformance classes, when exposed on the landing page. */
  conformsTo?: string[];
  /** Landing page links. */
  links?: StacLink[];
}

/** Optional STAC API features detected from the server conformance classes. */
export interface StacCapabilities {
  /** Whether the free-text search (q) is supported. */
  freeText: boolean;
  /** Whether sorting is supported on the /search endpoint. */
  searchSort: boolean;
  /** Whether sorting is supported on the /collections/{id}/items endpoint. */
  itemsSort: boolean;
  /** Whether the API advertises the CQL2 JSON filter language. */
  cql2Json: boolean;
}

/** Parameters for STAC API search requests. */
export interface StacSearchParams {
  /** Collection IDs to filter by. */
  collections?: string[];
  /** Bounding box [west, south, east, north]. */
  bbox?: [number, number, number, number];
  /** ISO 8601 datetime interval (e.g., "2020-01-01T00:00:00Z/2023-12-31T23:59:59Z"). */
  datetime?: string;
  /** Free-text search query (STAC API free-text extension). */
  q?: string;
  /** Maximum number of items per page. */
  limit?: number;
  /** Sort criteria. */
  sortby?: StacSortBy[];
  /** CQL2 JSON expression used to filter queryable properties. */
  filter?: StacCql2Expression;
  /** Filter language for the CQL2 expression. */
  filterLang?: 'cql2-json';
}

/** Filter values submitted by the filter panel. */
export interface StacFilterValues {
  /** Collection IDs selected by the user. */
  collections?: string[];
  /** Bounding box [west, south, east, north] in EPSG:4326. */
  bbox?: [number, number, number, number];
  /** ISO 8601 datetime interval. */
  datetime?: string;
  /** Free-text search query. */
  q?: string;
  /** CQL2 property predicates requested by the user. */
  propertyFilters?: Record<string, { operator?: string; value: string }>;
  /** Compiled CQL2 JSON filter. */
  filter?: StacCql2Expression;
  /** Sort field and direction selected by the user. */
  sortBy?: StacSortBy[];
  /** Whether to only return items whose full geometry is contained in the bbox. */
  containedInExtent?: boolean;
}

/** Filter-panel control state needed to restore user selections after navigating back from results. */
export interface StacFilterPanelState {
  /** Collection IDs checked in the collection filter; empty means all allowed collections. */
  selectedCollections: string[];
  /** Whether to search using the current map extent. */
  useMapExtent: boolean;
  /** Whether returned item geometry must be fully within the map extent. */
  containedInExtent: boolean;
  /** Start date entered by the user, as YYYY-MM-DD. */
  startDate: string;
  /** End date entered by the user, as YYYY-MM-DD. */
  endDate: string;
  /** Free-text value entered by the user. */
  keyword: string;
  /** CQL2 property filter values keyed by queryable property name. */
  propertyFilters: Record<string, { operator?: string; value: string }>;
  /** Sort field selected in the panel. */
  sortField: string;
  /** Sort direction selected in the panel. */
  sortDirection: 'asc' | 'desc';
}

/** STAC API search response. */
export interface StacSearchResult {
  /** Result type (always "FeatureCollection"). */
  type: 'FeatureCollection';
  /** Array of STAC items. */
  features: StacItem[];
  /** Number of features returned. */
  numberReturned?: number;
  /** Number of features matched. */
  numberMatched?: number;
  /** Links for pagination. */
  links?: StacLink[];
}

/** The panel views for the STAC browser. */
export type PanelView = 'collections' | 'collection-detail' | 'search' | 'search-results' | 'item-detail';

/** Top-level mode toggle. */
export type BrowseMode = 'browse' | 'search';

/** Response from GET /collections/{id}/items. */
export interface StacItemsResponse {
  /** Result type (always "FeatureCollection"). */
  type: 'FeatureCollection';
  /** Array of STAC items. */
  features: StacItem[];
  /** Number of features returned. */
  numberReturned?: number;
  /** Number of features matched. */
  numberMatched?: number;
  /** Links for pagination. */
  links?: StacLink[];
}

/** Display format of a configured STAC field. */
export type StacFieldFormat = 'text' | 'date' | 'datetime' | 'number' | 'epsg' | 'url' | 'json';

/** A configured STAC item field to display. */
export interface StacFieldConfig {
  /** Dot path of the field in the STAC item (e.g., "properties.scale", "collection", "assets.thumbnail.href"). */
  field: string;
  /** Optional label (plain text or a translation key), defaults to the last segment of the field path. */
  label?: string;
  /** Optional display format, defaults to "text". */
  format?: StacFieldFormat;
}

/** How the item preview is displayed on the map. */
export type StacPreviewMode = 'auto' | 'cog' | 'thumbnail' | 'none';

/** Collections restriction options. */
export interface StacCollectionsConfig {
  /** Collection IDs to show (all when omitted). */
  include?: string[];
  /** Collection IDs to hide. */
  exclude?: string[];
  /** Collection ID opened directly when the browser starts. */
  default?: string;
  /** Whether searches are always restricted to the allowed collections, defaults to true. */
  restrictSearch?: boolean;
}

/** Item display options. */
export interface StacItemViewConfig {
  /** Dot path of the field used as the item title, defaults to "properties.title" then "id". */
  titleField?: string;
  /** Fields shown on the item cards (light view). */
  summaryFields?: StacFieldConfig[];
  /** Fields shown in the metadata view, "all" for every item property. */
  metadataFields?: 'all' | StacFieldConfig[];
  /** Dot paths of fields never shown in the metadata view. */
  excludeFields?: string[];
}

/** Item preview options. */
export interface StacPreviewConfig {
  /** How the preview is displayed on the map. */
  mode?: StacPreviewMode;
  /** Asset roles or asset keys used to pick the preview asset, in priority order. */
  assetPriority?: string[];
  /** Opacity (0-1) of the preview overlay. */
  opacity?: number;
}

/** Actions available on an item. */
export interface StacActionsConfig {
  /** Show the zoom to extent action. */
  zoom?: boolean;
  /** Show the show on map action. */
  showOnMap?: boolean;
  /** Show the download action. */
  download?: boolean;
  /** Show the copy URL action. */
  copyUrl?: boolean;
}

/** Plugin configuration type. */
export interface StacBrowserConfig {
  /** Base URL of the STAC API. */
  stacUrl: string;
  /** Collections restriction options. */
  collections?: StacCollectionsConfig;
  /** Filter panel options. */
  filters?: {
    collections?: boolean;
    temporal?: boolean;
    spatial?: boolean;
    keyword?: boolean;
    /** Show interactive sort controls when the API advertises sorting. */
    sort?: boolean;
    /** Show all server queryables or only the listed property names as CQL2 filters. */
    properties?: boolean | (string | StacPropertyFilterConfig)[];
  };
  /** Default filter values. */
  defaults?: {
    collections?: string[];
    bbox?: [number, number, number, number];
    datetime?: string;
    limit?: number;
    sortBy?: StacSortBy[];
  };
  /** Item display options. */
  itemView?: StacItemViewConfig;
  /** Item preview options. */
  preview?: StacPreviewConfig;
  /** Styles for collection and search extent footprints. */
  footprintStyles?: StacFootprintStylesConfig;
  /** Actions available on an item. */
  actions?: StacActionsConfig;
  /** Collection-specific item view, preview, and action overrides. */
  collectionOverrides?: Record<string, StacCollectionOverride>;
  /** Show previews on map (master switch). */
  displayPreview?: boolean;
  /** Whether panel opens automatically. */
  isOpen: boolean;
}

/** Display options shared by the item lists and cards. */
export interface StacItemDisplayOptions {
  /** Optional item display options. */
  itemView?: StacItemViewConfig;
  /** Optional actions available on an item. */
  actions?: StacActionsConfig;
  /** Optional item preview options. */
  preview?: StacPreviewConfig;
  /** Styles for collection and search extent footprints. */
  footprintStyles?: StacFootprintStylesConfig;
  /** Collection-specific display overrides. */
  collectionOverrides?: Record<string, StacCollectionOverride>;
  /** Whether map previews are enabled. */
  isPreviewEnabled: boolean;
}

/** Item selection and preview state with the callbacks acting on it. */
export interface StacItemInteractions {
  /** Colors of the selected items, keyed by item id. */
  selectedColors: Record<string, string>;
  /** Ids of the items previewed on the map. */
  previewedIds: Record<string, boolean>;
  /** Toggles the selection (colored footprint) of an item. */
  onToggleSelected: (item: StacItem) => void;
  /** Toggles the map preview of an item. */
  onTogglePreview: (item: StacItem) => void;
  /** Zooms to an item. */
  onZoom: (item: StacItem) => void;
  /** Opens the full item detail view. */
  onOpenDetail: (item: StacItem) => void;
}
