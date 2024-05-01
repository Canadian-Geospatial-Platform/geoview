import { TypeJsonObject } from '../../config-types';
import {
  TypeBaseSourceVectorInitialConfig,
  TypeDisplayLanguage,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageInitialConfig,
  TypeSourceImageStaticInitialConfig,
  TypeSourceImageWmsInitialConfig,
  TypeSourceTileInitialConfig,
  TypeVectorSourceInitialConfig,
  TypeVectorTileSourceInitialConfig,
} from '../../map-schema-types';
import { AbstractGeoviewLayerConfig } from '../geoview-config/abstract-geoview-layer-config';
import { ConfigBaseClass } from './config-base-class';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source:
    | TypeBaseSourceVectorInitialConfig
    | TypeSourceTileInitialConfig
    | TypeVectorSourceInitialConfig
    | TypeVectorTileSourceInitialConfig
    | TypeSourceImageInitialConfig
    | TypeSourceImageWmsInitialConfig
    | TypeSourceImageEsriInitialConfig
    | TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sub layer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
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
    // If the user didn't provide a source then create an empty one else keep the user one.
    this.source = layerConfig.source || {};
  }

  /**
   * The getter method that returns the schemaPath property.
   *
   * @returns {string} The schemaPath associated to the sub layer.
   */
  abstract get schemaPath(): string;

  /**
   * The getter method that returns the entryType property.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sub layer.
   */
  abstract getEntryType(): TypeLayerEntryType;
}
