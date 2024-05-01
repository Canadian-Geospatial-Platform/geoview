import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { TypeJsonObject } from '@config/types/config-types';
import {
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
  TypeLayerInitialSettings,
  TypeLayerEntryType,
  TypeDisplayLanguage,
} from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { isvalidComparedToSchema } from '@config/utils';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  source = {} as TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sub layer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sub layer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode: ConfigBaseClass
  ) {
    super(layerConfig, initialSettings, language, geoviewLayerConfig, parentNode);
    this.layerFilter = layerConfig.layerFilter as string;
    this.style = layerConfig.style ? { ...(layerConfig.style as TypeStyleConfig) } : undefined;
    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    if (!this.source) this.source = {}; // If the user didn't provide a source then create an empty one else keep the user one.
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = geoviewLayerConfig.metadataAccessPath;
    if (!isvalidComparedToSchema(this.schemaPath, this)) this.propagateError();
  }

  /**
   * The getter method that returns the schemaPath property.
   *
   * @returns {string} The schemaPath associated to the sub layer.
   */
  get schemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_DYNAMIC;
  }

  /**
   * A method that returns the entryType property.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sub layer.
   */
  getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
  }
}
