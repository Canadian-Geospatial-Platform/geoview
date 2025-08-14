import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeSourceImageStaticInitialConfig } from '@/api/config/types/map-schema-types';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

export interface ImageStaticLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source: TypeSourceImageStaticInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.IMAGE_STATIC;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  declare layerEntryProps: ImageStaticLayerEntryConfigProps;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {ImageStaticLayerEntryConfigProps} layerConfig -  The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ImageStaticLayerEntryConfigProps) {
    super(layerConfig);

    // Write the default properties when not specified
    this.source.dataAccessPath ??= layerConfig.source.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

    if (
      !this.source.dataAccessPath!.toLowerCase().endsWith('.png') &&
      !this.source.dataAccessPath!.toLowerCase().endsWith('.jpg') &&
      !this.source.dataAccessPath!.toLowerCase().endsWith('.jpeg')
    )
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}${this.layerId}`
        : `${this.source.dataAccessPath}/${this.layerId}`;
  }
}
