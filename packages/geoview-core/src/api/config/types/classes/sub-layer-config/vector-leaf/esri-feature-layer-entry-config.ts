import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import { isvalidComparedToInputSchema, isvalidComparedToInternalSchema } from '@config/utils';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeDisplayLanguage,
  TypeSourceEsriFeatureInitialConfig,
} from '@config/types/map-schema-types';
import { GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

/**
 * The ESRI feature geoview sublayer class.
 */
export class EsriFeatureLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
  /** Source settings to apply to the GeoView feature layer source at creation time. */
  declare source: TypeSourceEsriFeatureInitialConfig;

  /** Style to apply to the feature layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ) {
    super(layerConfig, initialSettings, language, geoviewLayerConfig, parentNode);
    // Apply user config to the instance variables.
    this.style = layerConfig.style ? { ...Cast<TypeStyleConfig>(layerConfig.style) } : undefined;
    if (Number.isNaN(this.layerId)) {
      this.setErrorDetectedFlag();
      throw new GeoviewLayerInvalidParameterError('LayerIdInvalidType', [this.layerPath]);
    }
    // Validate the structure
    if (!isvalidComparedToInputSchema(this.schemaPath, layerConfig)) this.setErrorDetectedFlag();
    if (!isvalidComparedToInternalSchema(this.schemaPath, this, true)) this.setErrorDetectedFlag();
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
