import { merge } from 'lodash';
import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';
import { XyzLayerConfig } from '@/api/config/types/classes/geoview-config/raster-config/xyz-tile-config';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { Extent, TypeLayerInitialSettings } from '@/api/config/types/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of a XYZ tile GeoView sublayer to display on the map.
 */
export class XyzGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * Shadow method used to do a cast operation on the parent method to return XyzLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {XyzLayerConfig} The Geoview layer configuration that owns this XYZ tile layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): XyzLayerConfig {
    return super.getGeoviewLayerConfig() as XyzLayerConfig;
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
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    if (layerMetadata?.attributions) this.attributions.push(layerMetadata.attributions as string);
    this.layerName = layerMetadata.layerName as string;

    this.initialSettings = Cast<TypeLayerInitialSettings>(merge(this.initialSettings, layerMetadata.initialSettings));

    if (layerMetadata?.initialSettings?.extent) {
      this.initialSettings.extent = validateExtentWhenDefined(layerMetadata.initialSettings.extent as Extent);
      if (this?.initialSettings?.extent?.find?.((value, i) => value !== layerMetadata.initialSettings.extent[i]))
        logger.logWarning(
          `The extent specified in the metadata for the layer path “${this.getLayerPath()}” is considered invalid and has been corrected.`
        );
    }

    if (layerMetadata?.bounds) {
      this.bounds = validateExtentWhenDefined(layerMetadata.bounds as Extent);
      if (this?.bounds?.find?.((value, i) => value !== layerMetadata.bounds[i]))
        logger.logWarning(
          `The bounds specified in the metadata for the layer path “${this.getLayerPath()}” is considered invalid and has been corrected.`
        );
    }

    let metadataLayerConfigFound: XYZTilesLayerEntryConfig | TypeJsonObject | undefined;
    if (layerMetadata?.listOfLayerEntryConfig) {
      metadataLayerConfigFound = Cast<XYZTilesLayerEntryConfig[]>(layerMetadata?.listOfLayerEntryConfig).find(
        (metadataLayerConfig) => metadataLayerConfig.layerId === this.layerId
      );
    }

    // For ESRI MapServer XYZ Tiles
    if (layerMetadata?.layers) {
      metadataLayerConfigFound = (layerMetadata?.layers as TypeJsonArray).find(
        (metadataLayerConfig) => metadataLayerConfig.id.toString() === this.layerId
      );
    }

    // Set zoom limits for max / min zooms
    const maxScale = metadataLayerConfigFound?.maxScale as number;
    const minScaleDenominator = (metadataLayerConfigFound as TypeJsonObject)?.minScaleDenominator as number;
    // eslint-disable-next-line no-param-reassign
    this.maxScale =
      !maxScale && !minScaleDenominator
        ? this.maxScale
        : Math.max(maxScale ?? -Infinity, minScaleDenominator ?? -Infinity, this.maxScale ?? -Infinity);

    const minScale = metadataLayerConfigFound?.minScale as number;
    const maxScaleDenominator = (metadataLayerConfigFound as TypeJsonObject)?.maxScaleDenominator as number;
    // eslint-disable-next-line no-param-reassign
    this.minScale =
      !minScale && !maxScaleDenominator
        ? this.minScale
        : Math.min(minScale ?? Infinity, maxScaleDenominator ?? Infinity, this.minScale ?? Infinity);
  }

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
