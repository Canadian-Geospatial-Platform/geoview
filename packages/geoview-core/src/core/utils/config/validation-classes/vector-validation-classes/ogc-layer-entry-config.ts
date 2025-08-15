import {
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeLayerMetadataOGC,
  TypeSourceOgcFeatureInitialConfig,
} from '@/api/config/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Projection } from '@/geo/utils/projection';

export interface OgcFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceOgcFeatureInitialConfig;
}

export class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.OGC_FEATURE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: OgcFeatureLayerEntryConfigProps;

  declare source: TypeSourceOgcFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {OgcFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcFeatureLayerEntryConfigProps) {
    super(layerConfig);

    // Value for this.source.format can only be featureAPI.
    this.source ??= { format: 'featureAPI' };
    this.source.format ??= 'featureAPI';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataOGC | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataOGC | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataOGC | undefined;
  }
}
