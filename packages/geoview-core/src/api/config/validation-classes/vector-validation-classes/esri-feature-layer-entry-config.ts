import { ConfigClassOrType, CONST_LAYER_TYPES, TypeGeoviewLayerConfig, TypeLayerMetadataEsri } from '@/api/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { TypeEsriFeatureLayerConfig, TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';

export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceEsriFeatureInitialConfig;
}

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceEsriFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
    this.maxRecordCount = layerConfig.maxRecordCount;

    // Write the default properties when not specified
    this.source ??= { format: 'EsriJSON' };
    this.source.format ??= 'EsriJSON';
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.getMetadataAccessPath();

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';

    // Remove ID from dataAccessPath
    const splitAccessPath = this.source.dataAccessPath!.split('/');
    if (
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'featureserver' &&
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'mapserver'
    ) {
      splitAccessPath.pop();
      splitAccessPath.pop();
      this.source.dataAccessPath = `${splitAccessPath.join('/')}/`;
    }
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a Esri Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a Esri Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeEsriFeature(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriFeatureLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
  }
}
