import { TypeJsonObject } from '../../config-types';
import {
  TypeBaseSourceVectorInitialConfig,
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
  source?:
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
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sub layer.
   */
  constructor(layerConfig: TypeJsonObject, initialSettings: TypeLayerInitialSettings, geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    super(layerConfig, initialSettings, geoviewLayerConfig);
    this.source = { ...(layerConfig.source as TypeSourceImageEsriInitialConfig) };
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate an AbstractBaseLayerEntryConfig object. The interaction with the instance will use the language
   * stored in the #geoviewConfig object. The language associated to a configuration can be changed using the setConfigLanguage.
   * @param {TypeJsonObject} jsonLeafConfig The leaf layer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig | undefined} geoviewInstance The GeoView instance that owns the sub layer.
   *
   * @returns {AbstractBaseLayerEntryConfig} The leaf layer instance or undefined if there is an error.
   */
  static /* use async later */ getInstance(
    jsonLeafConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewInstance: AbstractGeoviewLayerConfig
  ): Promise<AbstractBaseLayerEntryConfig | undefined> {
    const leafLayerInstance = geoviewInstance.createLeafNode(jsonLeafConfig, initialSettings, geoviewInstance);
    // process metadata here
    // set default here
    // validate here
    return Promise.resolve(leafLayerInstance);
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
