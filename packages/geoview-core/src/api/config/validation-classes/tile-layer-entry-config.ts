import type { TypeGeoviewLayerType, TypeLayerEntryType, TypeSourceTileInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { XYZTilesLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import type { VectorTilesLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export abstract class TileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
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

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeSourceTileInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceTileInitialConfig {
    return super.getSource();
  }

  // #endregion OVERRIDES
}
