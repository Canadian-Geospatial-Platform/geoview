import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import { TypeStyleConfig, TypeLayerEntryType, TypeSourceEsriFeatureInitialConfig } from '@config/types/map-schema-types';

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
   * This method is the last to be called in the sequence of configuration parameter assignment according to the preceding rules,
   * the first being the assignment of user parameters and the second the assignment of metadata. Configuration parameters that
   * already have a value are not changed when a subsequent assignment phase takes place. In other words, default value assignment
   * does not change an already initialized metadata parameter, and metadata assignment does not change the value of a user-supplied
   * parameter.
   */
  protected applyDefaultsValues(): void {
    this.source = defaultsDeep(this.source, { maxRecordCount: 0, format: 'EsriJSON', featureInfo: { queryable: false } });
  }

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected
   */
  protected override get schemaPath(): string {
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
}
