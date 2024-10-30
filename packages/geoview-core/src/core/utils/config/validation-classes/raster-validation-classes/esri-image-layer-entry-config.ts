import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeSourceImageEsriInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_IMAGE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    // if layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
  }
}
