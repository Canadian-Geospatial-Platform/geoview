import { merge } from 'lodash';
import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import {
  TypeLayerStyleConfig,
  TypeLayerEntryType,
  TypeSourceXyzInitialConfig,
  TypeLayerInitialSettings,
  Extent,
} from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { XyzLayerConfig } from '../../../geoview-config/raster-config/xyz-tile-config';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';

// ====================
// #region CLASS HEADER
/**
 * The XYZ tile geoview sublayer class.
 */

export class XyzLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // ==================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  source?: TypeSourceXyzInitialConfig;

  /** Style to apply to the raster layer. */
  layerStyle?: TypeLayerStyleConfig;
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */
  // ==========================
  // #region OVERRIDE

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @override
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.XYZ_TILES;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_TILE;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to returXyzLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {XyzLayerConfig} The Geoview layer configuration that owns this XYZ tile layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): XyzLayerConfig {
    return super.getGeoviewLayerConfig() as XyzLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return Promise.resolve();

    // If the XYZ tile GeoView layer doesn't have service metadata, the layer metadata are set using an empty object and they
    // will be fetch on the fly by the layer api.
    if (Object.keys(this.getGeoviewLayerConfig().getServiceMetadata()).length === 0) {
      this.setLayerMetadata({});
      return Promise.resolve();
    }

    const layerMetadata = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (layerMetadata) {
      this.setLayerMetadata(layerMetadata);

      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();

      if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
        throw new GeoviewLayerConfigError(
          `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
        );
      }

      return Promise.resolve();
    }

    logger.logError(`Can't find layer's metadata for layerPath ${this.getLayerPath()}.`);
    this.setErrorDetectedFlag();
    return Promise.resolve();
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   * @override
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      crossOrigin: 'Anonymous',
      featureInfo: {
        queryable: true,
        nameField: '',
        outfields: [],
      },
    };
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();
    // return if the layer has no metadata.
    if (Object.keys(layerMetadata).length === 0) return;

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
