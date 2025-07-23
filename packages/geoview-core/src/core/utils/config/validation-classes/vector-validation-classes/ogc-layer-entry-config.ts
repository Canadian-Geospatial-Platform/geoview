import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeMetadata } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeSourceOgcFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { Projection } from '@/geo/utils/projection';

export class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.OGC_FEATURE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceOgcFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Value for this.source.format can only be featureAPI.
    this.source ??= { format: 'featureAPI' };
    this.source.format ??= 'featureAPI';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;
  }
}

export interface TypeMetadataOGCFeature extends TypeMetadata {
  collections: TypeMetadataOGCFeatureCollection[];
}

export interface TypeMetadataOGCFeatureCollection {
  id: string;
  description: string;
  extent: TypeMetadataOGCFeatureCollectionExtent;
}

export interface TypeMetadataOGCFeatureCollectionExtent {
  spatial: TypeMetadataOGCFeatureCollectionExtentSpatial;
}

export interface TypeMetadataOGCFeatureCollectionExtentSpatial {
  crs: string;
  bbox: number[][];
}
