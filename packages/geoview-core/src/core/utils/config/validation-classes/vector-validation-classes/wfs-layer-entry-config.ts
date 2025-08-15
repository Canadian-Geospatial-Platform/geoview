import {
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeLayerMetadataWfs,
  TypeSourceWFSVectorInitialConfig,
} from '@/api/config/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Projection } from '@/geo/utils/projection';

export interface WfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceWFSVectorInitialConfig;
}

export class WfsLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.WFS;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare layerEntryProps: WfsLayerEntryConfigProps;

  declare source: TypeSourceWFSVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WfsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WfsLayerEntryConfigProps) {
    super(layerConfig);

    // Value for this.source.format can only be WFS.
    this.source ??= { format: 'WFS' };
    this.source.format ??= 'WFS';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataWfs[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataWfs[] | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataWfs[] | undefined;
  }
}
