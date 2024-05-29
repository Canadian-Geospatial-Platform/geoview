import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  CONST_LAYER_ENTRY_TYPES,
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
  TypeStyleGeometry,
  TypeStyleSettings,
} from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_DYNAMIC;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriDynamicLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
    // if layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath! };
  }

  /**
   * Guesses the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleGeometry} The guessed TypeStyleGeometry
   */
  getTypeGeometry(): TypeStyleGeometry {
    return Object.keys(this.style!)[0] as TypeStyleGeometry;
  }

  /**
   * Guesses the TypeStyleSettings associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleSettings} The guessed TypeStyleSettings
   */
  getStyleSettings(): TypeStyleSettings | undefined {
    return this.style?.[this.getTypeGeometry()];
  }
}
