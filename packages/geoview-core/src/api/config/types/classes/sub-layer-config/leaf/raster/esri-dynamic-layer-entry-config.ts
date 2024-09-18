import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast } from '@config/types/config-types';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeSourceEsriDynamicInitialConfig,
  TypeEsriFormatParameter,
  TypeValidMapProjectionCodes,
} from '@config/types/map-schema-types';
import { AbstractBaseEsriLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';
import { EsriBaseRenderer, createStyleUsingEsriRenderer } from '@/api/config/esri-renderer-parser';

// ========================
// #region CLASS HEADER
/**
 * The ESRI dynamic geoview sublayer class.
 */

export class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  // =========================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

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
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_DYNAMIC;
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
   * This method is used to parse the layer metadata and extract the style, source information and other properties.
   *
   * @protected @override
   */
  protected override parseLayerMetadata(): void {
    super.parseLayerMetadata();

    const layerMetadata = this.getLayerMetadata();

    this.source = {
      maxRecordCount: (layerMetadata?.maxRecordCount || 0) as number,
      // layerFilter?: is optional,
      featureInfo: this.createFeatureInfoUsingMetadata(),
      format: 'png' as TypeEsriFormatParameter,
      transparent: true,
      projection: layerMetadata.sourceSpatialReference.wkid as TypeValidMapProjectionCodes,
    };

    const renderer = Cast<EsriBaseRenderer>(layerMetadata.drawingInfo?.renderer);
    if (renderer) this.style = createStyleUsingEsriRenderer(renderer);

    this.processTemporalDimension(layerMetadata.timeInfo);
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
      maxRecordCount: 0,
      format: 'png',
      projection: 3978,
      featureInfo: {
        queryable: false,
        nameField: '',
        outfields: [],
      },
    };
  }
  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
