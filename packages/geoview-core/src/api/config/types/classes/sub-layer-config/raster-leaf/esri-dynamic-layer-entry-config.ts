import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeSourceEsriDynamicInitialConfig,
  TypeLayerInitialSettings,
} from '@config/types/map-schema-types';

/**
 * The ESRI dynamic geoview sublayer class.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * Apply default value to undefined fields. The default values to be used for the initialSettings are
   * inherited from the object that owns this sublayer instance.
   *
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited by the parent container.
   */
  override applyDefaultValueToUndefinedFields(initialSettings: TypeLayerInitialSettings): void {
    super.applyDefaultValueToUndefinedFields(initialSettings);
    this.source = defaultsDeep(this.source, { maxRecordCount: 0, format: 'png', featureInfo: { queryable: false } });
  }

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected
   */
  protected override get schemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_DYNAMIC;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
  }
}
