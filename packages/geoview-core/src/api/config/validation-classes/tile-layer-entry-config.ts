import { TypeGeoviewLayerType, TypeLayerEntryType, TypeSourceTileInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { XYZTilesLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { VectorTilesLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export abstract class TileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Initial settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceTileInitialConfig;

  /**
   * The class constructor.
   * @param {VectorLayerEntryConfigProps | TileLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(
    layerConfig: VectorTilesLayerEntryConfigProps | XYZTilesLayerEntryConfigProps | TileLayerEntryConfig,
    schemaTag: TypeGeoviewLayerType,
    entryType: TypeLayerEntryType
  ) {
    super(layerConfig, schemaTag, entryType);
  }
}
