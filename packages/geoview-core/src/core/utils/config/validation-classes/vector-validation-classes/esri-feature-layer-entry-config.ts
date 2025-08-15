import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeLayerMetadataEsri } from '@/api/config/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';

export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceEsriFeatureInitialConfig;
}

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_FEATURE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: EsriFeatureLayerEntryConfigProps;

  declare source: TypeSourceEsriFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfigProps) {
    super(layerConfig);
    this.maxRecordCount = layerConfig.maxRecordCount;

    // Write the default properties when not specified
    this.source ??= { format: 'EsriJSON' };
    this.source.format ??= 'EsriJSON';
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

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
}
