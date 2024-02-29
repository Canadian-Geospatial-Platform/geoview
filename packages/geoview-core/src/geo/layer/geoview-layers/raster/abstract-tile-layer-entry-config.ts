import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validationClasses/abstract-base-layer-entry-config';
import { GeoviewChild, TypeLayerEntryType, TypeStyleConfig, TypeVectorTileSourceInitialConfig } from '@/geo/map/map-schema-types';

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector tile layer to display on the map. The vector data is divided into a tile grid.
 */
// ? this class is not abstract but it is the main class for raster type layers. Other classes extend this class.
// file naming temporary
export class VectorTileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'vector-tile' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorTileSourceInitialConfig;

  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {VectorTileLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorTileLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}
