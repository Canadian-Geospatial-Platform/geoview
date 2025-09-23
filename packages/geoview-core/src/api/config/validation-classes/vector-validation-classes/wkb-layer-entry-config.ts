import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import {
  ConfigClassOrType,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerConfig,
  TypeSourceWkbVectorInitialConfig,
} from '@/api/types/layer-schema-types';
import { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
import { Projection } from '@/geo/utils/projection';

export interface WkbLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceWkbVectorInitialConfig;
}

export class WkbLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceWkbVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WkbLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WkbLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WKB);

    // Value for this.source.format can only be WKB.
    this.source ??= { format: 'WKB' };
    this.source.format ??= 'WKB';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    if (layerConfig.source?.dataAccessPath) this.source.dataAccessPath = layerConfig.source.dataAccessPath;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.getMetadataAccessPath();
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a WKB Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WKB Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeWKBLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWkbLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WKB);
  }
}
