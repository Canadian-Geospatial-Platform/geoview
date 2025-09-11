import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { CONST_LAYER_TYPES, TypeSourceWkbVectorInitialConfig } from '@/api/types/layer-schema-types';
import { Projection } from '@/geo/utils/projection';

export interface WkbLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceWkbVectorInitialConfig;
}

export class WkbLayerEntryConfig extends VectorLayerEntryConfig {
  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: WkbLayerEntryConfigProps;

  declare source: TypeSourceWkbVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WkbLayerEntryConfigProps | WkbLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WkbLayerEntryConfigProps | WkbLayerEntryConfig) {
    super(layerConfig, CONST_LAYER_TYPES.WKB);

    // Value for this.source.format can only be WKB.
    this.source ??= { format: 'WKB' };
    this.source.format ??= 'WKB';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    if (layerConfig.source?.dataAccessPath) this.source.dataAccessPath = layerConfig.source.dataAccessPath;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath!;
  }
}
