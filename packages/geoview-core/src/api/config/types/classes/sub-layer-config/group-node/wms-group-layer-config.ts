import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { Extent } from '@config/types/map-schema-types';
import { WmsLayerConfig } from '@config/types/classes/geoview-config/raster-config/wms-config';
import { isvalidComparedToInternalSchema } from '@config/utils';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';

import { validateExtentWhenDefined } from '@/geo/utils/utilities';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export class WmsGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * Shadow method used to do a cast operation on the parent method to return WmsLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {WmsLayerConfig} The Geoview layer configuration that owns this WFS layer entry config.
   * @override @async
   */
  override getGeoviewLayerConfig(): WmsLayerConfig {
    return super.getGeoviewLayerConfig() as WmsLayerConfig;
  }

  /** ***************************************************************************************************************************
   * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    // WMS service metadata contains the layer's metadata. We don't have to fetch again.
    const layerMetadata = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (layerMetadata) {
      // The layer group exists in the service metadata, use its metadata
      this.setLayerMetadata(layerMetadata);
    } else {
      // User defined layer groups cannot be found in the service metadata, we will use the topmost layer's metadata.
      this.setLayerMetadata(this.getGeoviewLayerConfig().getServiceMetadata().Capability.Layer);
    }

    // Parse the raw layer metadata and build the geoview configuration.
    this.parseLayerMetadata();

    await this.fetchListOfLayerMetadata();

    if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
      );
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to analyze metadata and extract the relevant information from a group layer based on a definition
   * provided by the WMS service.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    this.layerName = layerMetadata.Title as string;

    if (layerMetadata?.Attribution?.Title) this.attributions.push(layerMetadata.Attribution.Title as string);

    this.initialSettings.states!.queryable = (layerMetadata.queryable || false) as boolean;

    this.minScale = (layerMetadata.MinScaleDenominator as number) || 0;
    this.maxScale = (layerMetadata.MaxScaleDenominator as number) || 0;

    this.initialSettings.extent = validateExtentWhenDefined(layerMetadata.EX_GeographicBoundingBox as Extent);
    this.initialSettings.bounds = this.initialSettings.extent;
  }

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
