import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { TypeLayerEntryType, TypeSourceEsriImageInitialConfig, TypeValidMapProjectionCodes } from '@config/types/map-schema-types';
import { AbstractBaseEsriLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';

// ========================
// #region CLASS HEADER
/**
 * The ESRI Image geoview sublayer class.
 */

export class EsriImageLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  // ==================
  // #region PROPERTIES

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriImageInitialConfig;

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
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_IMAGE;
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

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the source information and other properties.
   *
   * @protected @override
   */
  protected override parseLayerMetadata(): void {
    super.parseLayerMetadata();

    const layerMetadata = this.getLayerMetadata();

    this.source.projection = (layerMetadata?.spatialReference?.latestWkid ||
      layerMetadata?.sourceSpatialReference?.latestWkid ||
      this.source.projection) as TypeValidMapProjectionCodes;
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   *
   * @override
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      crossOrigin: 'anonymous',
      format: 'png',
      transparent: true,
      projection: 3978,
    };
  }
  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
