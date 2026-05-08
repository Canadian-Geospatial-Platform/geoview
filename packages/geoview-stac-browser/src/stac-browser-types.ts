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
  /** Pagination token from previous response. */
  token?: string;
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

/** Plugin configuration type. */
export interface StacBrowserConfig {
  /** Base URL of the STAC API. */
  stacUrl: string;
  /** Filter panel options. */
  filters?: {
    collections?: boolean;
    temporal?: boolean;
    spatial?: boolean;
    keyword?: boolean;
  };
  /** Default filter values. */
  defaults?: {
    collections?: string[];
    bbox?: [number, number, number, number];
    datetime?: string;
    limit?: number;
  };
  /** Show preview thumbnails on map. */
  displayPreview?: boolean;
  /** Whether panel opens automatically. */
  isOpen: boolean;
}
