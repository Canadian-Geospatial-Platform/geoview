import type * as GeoJSON from 'geojson';

export interface StacCatalog {
  type: string;
  stac_verison: string;
  stac_extensions?: string[];
  id: string;
  title?: string;
  description: string;
  links: StacLink[];
}

export interface StacCollection {
  type: 'Collection';
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  title?: string;
  description: string;
  keywords?: string[];
  license: string;
  providers?: StacProviderObject[];
  extent: StacExtentObject;
  summaries?: Map<string, StacRangeObject | string[]>;
  links: StacLink[];
  assets?: Map<string, StacAssetObject>;
}

export interface StacProviderObject {
  name: string;
  description?: string;
  roles?: string[];
  url?: string;
}

export interface StacExtentObject {
  spatial: { bbox: GeoJSON.BBox };
  temporal: { interval: string[][] };
}

export interface StacRangeObject {
  minium: number | string;
  maximum: number | string;
}

export interface StacItemCollection {
  type: 'FeatureCollection';
  features: StacItem[];
  links?: StacLink[];
  numberMatched?: number;
  numberReturned?: number;
}

export interface StacItem {
  type: 'Feature';
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  geometry: GeoJSON.GeometryObject | null;
  bbox: GeoJSON.BBox;
  properties: StacPropertiesObject;
  links: StacLink[];
  assets: Record<string, StacAssetObject | null>;
  collection?: string;
}

export interface StacPropertiesObject {
  // [key: string]: string | null;
  collection: string | null;
  datetime: string | null;
  created: string | null;
  updated: string | null;
  'proj:epsg': number | null;
  'proj:geometry': GeoJSON.GeometryObject | null;
  'proj:shape': number[] | null;
  'proj:transform': number[] | null;
}

export interface StacAssetObject {
  href: string;
  title?: string;
  description?: string;
  type?: string; // Any preferably registered media type e.g. text/xml etc.
  roles: StacAssetRoleType[];
}

export interface StacLink {
  href: string;
  rel: StacRelationType;
  type?: StacMediaType;
  title?: string;
}

export type StacRelationType =
  | 'child'
  | 'collection'
  | 'derived_from'
  | 'item'
  | 'items'
  | 'next'
  | 'parent'
  | 'previous'
  | 'root'
  | 'self';
export type StacMediaType = 'application/geo+json' | 'application/json';
export type StacAssetRoleType = 'data' | 'metadata' | 'overview' | 'thumbnail';
