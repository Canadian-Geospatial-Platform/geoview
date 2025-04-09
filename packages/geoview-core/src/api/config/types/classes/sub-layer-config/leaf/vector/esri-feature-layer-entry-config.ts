import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { Cast } from '@/api/config/types/config-types';
import { AbstractBaseEsriLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';
import {
  TypeLayerStyleConfig,
  TypeLayerEntryType,
  TypeSourceEsriFeatureInitialConfig,
  TypeVectorSourceFormats,
  TypeValidMapProjectionCodes,
} from '@/api/config/types/map-schema-types';
import { EsriBaseRenderer, createStyleUsingEsriRenderer } from '@/api/config/esri-renderer-parser';

// ========================
// #region CLASS HEADER
/**
 * The ESRI feature geoview sublayer class.
 */
export class EsriFeatureLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  // =========================
  // #region PUBLIC PROPERTIES
  /** Source settings to apply to the GeoView feature layer source at creation time. */
  declare source: TypeSourceEsriFeatureInitialConfig;

  /** Style to apply to the feature layer. */
  layerStyle?: TypeLayerStyleConfig;
  // #endregion PUBLIC PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
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
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_FEATURE;
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

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the style and source information.
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
      format: 'EsriJSON' as TypeVectorSourceFormats, // The only possible value
      strategy: 'all', // default value
      projection:
        (layerMetadata.sourceSpatialReference.latestWkid as TypeValidMapProjectionCodes) ||
        (layerMetadata.sourceSpatialReference.wkid as TypeValidMapProjectionCodes),
    };

    const renderer = Cast<EsriBaseRenderer>(layerMetadata.drawingInfo?.renderer);
    if (renderer) this.layerStyle = createStyleUsingEsriRenderer(renderer);

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
      strategy: 'all',
      maxRecordCount: 0,
      format: 'EsriJSON',
      projection: 3978,
      featureInfo: {
        queryable: true,
        nameField: '',
        outfields: [],
      },
    };
  }
  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
