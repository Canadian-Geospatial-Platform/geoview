import {
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeLayerMetadataEsri,
  TypeSourceImageEsriInitialConfig,
} from '@/api/config/types/map-schema-types';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageEsriInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_IMAGE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  declare layerEntryProps: EsriImageLayerEntryConfigProps;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfigProps) {
    super(layerConfig);

    // Write the default properties when not specified
    this.source ??= {};

    // Format the dataAccessPath correctly
    this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';
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
