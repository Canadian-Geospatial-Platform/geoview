import { OSM, VectorTile, XYZ } from 'ol/source';
import { Extent } from 'ol/extent';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { TypeProjection } from '@/geo/utils/projection';
import { TypeLod } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';

/**
 * interface used to define a new basemap.
 */
export type TypeBasemapProps = {
  basemapId?: string;
  name: string;
  type: string;
  description: string;
  descSummary: string;
  altText: string;
  thumbnailUrl: string | Array<string>;
  layers: TypeBasemapLayer[];
  attribution: string[];
  zoomLevels: { min: number; max: number };
  defaultOrigin?: number[];
  defaultExtent?: Extent;
  defaultResolutions?: number[];
};

/**
 * interface used to define a new basemap layer
 */
export type TypeBasemapLayer = {
  basemapId: string;
  url?: string;
  jsonUrl?: string;
  styleUrl?: string | BasemapCreationStyleUrl;
  source: OSM | XYZ | VectorTile;
  type: string;
  opacity: number;
  resolutions: number[];
  origin: number[];
  minScale: number;
  maxScale: number;
  extent: Extent;
  copyright?: string;
};

export type BasemapCreationList = { [key: number]: { [name: string]: BasemapCreation } };

export type BasemapCreation = {
  jsonUrl: string;
  url?: string;
  styleUrl?: BasemapCreationStyleUrl | string;
};

export type BasemapCreationStyleUrl = {
  [language in TypeDisplayLanguage]: string;
};

export type BasemapJsonResponse = {
  copyrightText: string;
  minScale: number;
  maxScale: number;
  fullExtent: BasemapJsonResponseExtent;
  tileInfo: BasemapJsonResponseTileInfo;
};

export type BasemapJsonResponseExtent = {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
};

export type BasemapJsonResponseTileInfo = {
  origin: BasemapJsonResponseTileInfoOrigin;
  rows: number;
  cols: number;
  spatialReference: TypeProjection;
  lods: TypeLod[];
};

export type BasemapJsonResponseTileInfoOrigin = {
  x: number;
  y: number;
};
