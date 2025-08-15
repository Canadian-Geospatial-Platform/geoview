import { CONST_LAYER_ENTRY_TYPES, TypeSourceTileInitialConfig } from '@/api/config/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export abstract class TileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_TILE;

  /** Initial settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceTileInitialConfig;
}
