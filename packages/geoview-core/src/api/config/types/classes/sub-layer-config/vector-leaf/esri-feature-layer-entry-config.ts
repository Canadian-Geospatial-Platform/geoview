// Needs to disable class-methods-use-this because we need to pass the instance reference 'this' to the validator.
// eslint-disable-next-line @typescript-eslint/class-methods-use-this
import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast, TypeJsonObject } from '@config/types/config-types';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeDisplayLanguage,
  TypeVectorSourceFormats,
  TypeSourceEsriFeatureInitialConfig,
} from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { isvalidComparedToSchema } from '@config/utils';

/**
 * The ESRI feature geoview sublayer class.
 */
export class EsriFeatureLayerEntryConfig extends AbstractBaseLayerEntryConfig {
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
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ) {
    super(layerConfig, initialSettings, language, geoviewLayerConfig, parentNode);
    this.style = layerConfig.style ? { ...Cast<TypeStyleConfig>(layerConfig.style) } : undefined;
    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    this.source.format = 'EsriJSON' as TypeVectorSourceFormats; // Set the source.format property
    if (!isvalidComparedToSchema(this.schemaPath, layerConfig)) this.propagateError();
    if (!isvalidComparedToSchema(this.schemaPath, this)) this.propagateError();
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
