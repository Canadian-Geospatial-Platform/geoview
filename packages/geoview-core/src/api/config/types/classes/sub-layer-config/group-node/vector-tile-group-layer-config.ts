import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';
import { VectorTileLayerConfig } from '../../geoview-config/raster-config/vector-tile-config';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of a vector tile GeoView sublayer to display on the map.
 */
export class VectorTileGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * Shadow method used to do a cast operation on the parent method to return VectorTileLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {VectorTileLayerConfig} The Geoview layer configuration that owns this vector tile layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): VectorTileLayerConfig {
    return super.getGeoviewLayerConfig() as VectorTileLayerConfig;
  }

  /** ***************************************************************************************************************************
   * This method is used to fetch, parse and extract the relevant information from the metadata for the group layer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    const layerMetadata = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (layerMetadata) {
      this.setLayerMetadata(layerMetadata);

      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();
    }

    // Fetch the sub-layers metadata that compose the group.
    await this.fetchListOfLayerMetadata();

    if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
      );
    }
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {}

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
