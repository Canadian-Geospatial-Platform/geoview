import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast } from '@config/types/config-types';
import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeSourceEsriFeatureInitialConfig,
  TypeLayerInitialSettings,
} from '@config/types/map-schema-types';
import { EsriBaseRenderer, parseStyleUsingEsriRenderer } from '@/api/config/esri-renderer-parser';

/**
 * The ESRI feature geoview sublayer class.
 */
export class EsriFeatureLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  /** Source settings to apply to the GeoView feature layer source at creation time. */
  declare source: TypeSourceEsriFeatureInitialConfig;

  /** Style to apply to the feature layer. */
  style?: TypeStyleConfig;

  /**
   * Validate the node configuration using the schema associated to its layer type.
   * @protected
   * /
  protected override validateLayerConfig(layerConfig: TypeJsonObject): void {
    super.validateLayerConfig(layerConfig);
    if (!isvalidComparedToInputSchema(this.schemaPath, layerConfig)) this.setErrorDetectedFlag();
  }

  /**
   * Apply default value to undefined fields. The default values to be used for the initialSettings are
   * inherited from the object that owns this sublayer instance.
   *
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited by the parent container.
   */
  override applyDefaultValueToUndefinedFields(initialSettings: TypeLayerInitialSettings): void {
    super.applyDefaultValueToUndefinedFields(initialSettings);
    this.source = defaultsDeep(this.source, { maxRecordCount: 0, format: 'EsriJSON', featureInfo: { queryable: false } });
  }

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_FEATURE;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.VECTOR;
  }

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the style and source information.
   * @protected
   */
  protected override parseLayerMetadata(): void {
    const renderer = Cast<EsriBaseRenderer>(this.getLayerMetadata().drawingInfo?.renderer);
    if (renderer) this.style = parseStyleUsingEsriRenderer(renderer);
  }
}
