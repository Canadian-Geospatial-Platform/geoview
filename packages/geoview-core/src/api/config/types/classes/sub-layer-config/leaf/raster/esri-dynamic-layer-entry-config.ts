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
// #region CLASS DEFINITION
/**
 * The ESRI dynamic geoview sublayer class.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  // =========================
  // #region PUBLIC PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;
  // #endregion PUBLIC PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ==========================
  // #region OVERRIDE
  /**
   * @protected @override
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_DYNAMIC;
  }

  /**
   * @protected @override
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
  }

  /** ***************************************************************************************************************************
   * @protected @override
   * This method is used to parse the layer metadata and extract the style, source information and other properties.
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
   * @override
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
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
  // #endregion CLASS DEFINITION
}
