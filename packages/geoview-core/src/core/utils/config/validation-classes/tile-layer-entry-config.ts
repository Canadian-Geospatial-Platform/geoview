import { CONST_LAYER_ENTRY_TYPES, TypeSourceTileInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_TILE;

  /** Initial settings to apply to the GeoView image layer source at creation time. */
  declare source?: TypeSourceTileInitialConfig;

  /**
   * The class constructor.
   * @param {TileLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TileLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }
}
