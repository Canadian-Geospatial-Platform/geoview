import { CONST_LAYER_ENTRY_TYPES, GeoviewChild, TypeStyleConfig, TypeVectorSourceInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector layer to display on the map.
 */
export class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {VectorLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  override loadedFunction(): void {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}
