import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeSourceImageStaticInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.IMAGE_STATIC;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {ImageStaticLayerEntryConfig} layerConfig -  The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ImageStaticLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} when the metadataAccessPath is undefined.`
      );
    }

    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
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
