import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import { TypeStyleConfig, TypeLayerEntryType, TypeSourceEsriDynamicInitialConfig } from '@config/types/map-schema-types';

/**
 * The ESRI dynamic geoview sublayer class.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * This method is the last to be called in the sequence of configuration parameter assignment according to the preceding rules,
   * the first being the assignment of user parameters and the second the assignment of metadata. Configuration parameters that
   * already have a value are not changed when a subsequent assignment phase takes place. In other words, default value assignment
   * does not change an already initialized metadata parameter, and metadata assignment does not change the value of a user-supplied
   * parameter.
   */
  protected applyDefaultsValues(): void {
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
