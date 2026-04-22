import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataOGC } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

export interface OgcFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {}

export class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /**
   * Creates an instance of OgcFeatureLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: OgcFeatureLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.OGC_FEATURE);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeOgcFeatureLayerConfig {
    return super.getGeoviewLayerConfig() as TypeOgcFeatureLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataOGC | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataOGC | undefined;
  }

  // #endregion OVERRIDES

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents an OGC Feature layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for an OGC Feature layer; otherwise `false`
   */
  static isClassOrTypeOGCLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeOgcFeatureLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.OGC_FEATURE);
  }
}
