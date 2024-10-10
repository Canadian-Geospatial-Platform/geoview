import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast } from '@config/types/config-types';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeSourceGeoJsonInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeStyleGeometry,
  TypeLayerInitialSettings,
  Extent,
} from '@config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { GeoJsonLayerConfig } from '@config/types/classes/geoview-config/vector-config/geojson-config';
import { isvalidComparedToInternalSchema } from '@config/utils';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';

import { merge } from 'lodash';
import { logger } from '@/core/utils/logger';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { TimeDimension } from '@/core/utils/date-mgt';

// ====================
// #region CLASS HEADER
/**
 * The GeoJson geoview sublayer class.
 */

export class GeoJsonLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // ==================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceGeoJsonInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;
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
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.GEOJSON;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.VECTOR;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to return GeoJsonLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {GeoJsonLayerConfig} The Geoview layer configuration that owns this GeoJson layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): GeoJsonLayerConfig {
    return super.getGeoviewLayerConfig() as GeoJsonLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return Promise.resolve();

    // If the GeoJson GeoView layer doesn't have service metadata, the layer metadata are set using an empty object and they
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
      strategy: 'all',
      maxRecordCount: 0,
      crossOrigin: 'Anonymous',
      projection: 3978,
      featureInfo: {
        queryable: false,
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
    this.geometryType = (layerMetadata.geometryType || this.geometryType) as TypeStyleGeometry;
    this.layerName = layerMetadata.layerName as string;
    this.minScale = (layerMetadata?.minScale || this.minScale) as number;
    this.maxScale = (layerMetadata.maxScale || this.maxScale) as number;

    this.initialSettings = Cast<TypeLayerInitialSettings>(merge(this.initialSettings, layerMetadata.initialSettings));
    this.source.featureInfo = Cast<TypeFeatureInfoLayerConfig>(merge(this.source.featureInfo, layerMetadata.source.featureInfo));
    this.style = Cast<TypeStyleConfig>(merge(this.style, layerMetadata.style));
    this.temporalDimension = Cast<TimeDimension>(merge(this.temporalDimension, layerMetadata.temporalDimension));

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
  }

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
