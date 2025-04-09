import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import {
  TypeLayerStyleConfig,
  TypeLayerEntryType,
  TypeSourceWmsInitialConfig,
  Extent,
  WmsLayerConfig,
  AbstractGeoviewLayerConfig,
  EntryConfigBaseClass,
} from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';

// ========================
// #region CLASS HEADER
/**
 * The OGC WMS geoview sublayer class.
 */

export class WmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // =========================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceWmsInitialConfig;

  /** Style to apply to the raster layer. */
  layerStyle?: TypeLayerStyleConfig;

  constructor(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode: EntryConfigBaseClass | undefined) {
    super(layerConfig, geoviewConfig, parentNode);

    // if layerConfig.source.dataAccessPath is undefined, the metadataAccessPath defined on the root is used.
    if (!this.source) this.source = { projection: 3978 };

    // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
    // set to '' and will be filled in the fetchServiceMetadata method of the class WMS.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = '';

    // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
    // to the same value of the corresponding metadataAccessPath.
    // TODO: remove this wrapper replace when datacube updates the URLs
    this.getGeoviewLayerConfig().metadataAccessPath = this.getGeoviewLayerConfig().metadataAccessPath!.replace('wrapper/ramp/ogc', 'ows');
    if (this.getGeoviewLayerConfig().metadataAccessPath!.slice(-4).toLowerCase() !== '.xml')
      this.source.dataAccessPath = this.getGeoviewLayerConfig().metadataAccessPath;

    this.source.dataAccessPath = this.source.dataAccessPath!.replace('wrapper/ramp/ogc', 'ows');

    // Default value for layerConfig.source.serverType is 'mapserver'.
    if (!this.source.serverType) this.source.serverType = 'mapserver';
  }
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */
  // ================
  // #region OVERRIDE

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @override
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.WMS;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to return WmsLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {WmsLayerConfig} The Geoview layer configuration that owns this WMS layer entry config.
   * @override @async
   */
  override getGeoviewLayerConfig(): WmsLayerConfig {
    return super.getGeoviewLayerConfig() as WmsLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override
   */
  override fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return Promise.resolve();

    // WMS service metadata contains the layer's metadata.
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
      serverType: 'mapserver',
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

    if (layerMetadata?.Attribution?.Title) this.attributions.push(layerMetadata.Attribution.Title as string);

    this.bounds = layerMetadata.EX_GeographicBoundingBox as Extent;

    if (layerMetadata.queryable) this.source.featureInfo!.queryable = layerMetadata.queryable as boolean;

    // Overwrite user provided value if service doesn't allow that scale
    if (layerMetadata.maxScaleDenominator) {
      this.minScale = Math.min(this.minScale || Infinity, layerMetadata.maxScaleDenominator as number);
    }
    if (layerMetadata.minScaleDenominator) {
      this.maxScale = Math.max(this.maxScale || 0, layerMetadata.minScaleDenominator as number);
    }

    this.source.wmsStyle = layerMetadata.Style
      ? ((layerMetadata.Style as TypeJsonArray).map((style) => {
          return style.Name;
        }) as string[])
      : undefined;

    this.#processTemporalDimension(layerMetadata.Dimension);
  }

  // #endregion OVERRIDE

  // ===============
  // #region PRIVATE
  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it existds in the service metadata
   * @param {TypeJsonObject} wmsDimension The WMS time dimension object
   * @private
   */
  #processTemporalDimension(wmsDimension: TypeJsonObject): void {
    if (wmsDimension) {
      const temporalDimension: TypeJsonObject | undefined = (wmsDimension as TypeJsonArray).find((dimension) => dimension.name === 'time');
      if (temporalDimension) this.temporalDimension = DateMgt.createDimensionFromOGC(temporalDimension);
    }
  }
  // #endregion PRIVATE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
