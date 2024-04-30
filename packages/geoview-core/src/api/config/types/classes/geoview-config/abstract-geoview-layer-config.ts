import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeGeoviewLayerType, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { TypeDisplayLanguage, TypeLayerInitialSettings, TypeLocalizedString } from '@config/types/map-schema-types';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { normalizeLocalizedString } from '@config/utils';
import { CV_CONST_SUB_LAYER_TYPES, CV_DEFAULT_LAYER_INITIAL_SETTINGS } from '@config/types/config-constants';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
  /** The language used when interacting with this instance of MapFeaturesConfig. */
  #language;

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject;

  /** If the geoview layer is linked to a map config, we keep a reference to the map for message propagation */
  #mapFeaturesConfig?: MapFeaturesConfig;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
   * information.
   */
  geoviewLayerName: TypeLocalizedString;

  /** The GeoView layer access path (English/French). */
  metadataAccessPath: TypeLocalizedString;

  /** Date format used by the service endpoint. */
  serviceDateFormat: string | undefined;

  /** Date format used by the getFeatureInfo to output date variable. */
  externalDateFormat: string | undefined;

  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoView layer. */
  listOfLayerEntryConfig: ConfigBaseClass[] = [];

  /** ***************************************************************************************************************************
   * The class constructor.
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeaturesConfig?: MapFeaturesConfig) {
    this.#originalgeoviewLayerConfig = cloneDeep(geoviewLayerConfig);
    // Topmost layer must be a layer group or a leaf node.
    if ((this.#originalgeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray).length > 1)
      this.#originalgeoviewLayerConfig.listOfLayerEntryConfig = {
        layerId: this.#originalgeoviewLayerConfig.geoviewLayerId,
        initialSettings: this.#originalgeoviewLayerConfig.initialSettings,
        layerName: this.#originalgeoviewLayerConfig.geoviewLayerName,
        entryType: CV_CONST_SUB_LAYER_TYPES.GROUP as TypeJsonObject,
        listOfLayerEntryConfig: this.#originalgeoviewLayerConfig.listOfLayerEntryConfig,
      };

    this.#mapFeaturesConfig = mapFeaturesConfig;
    this.#language = language;

    this.geoviewLayerId = (geoviewLayerConfig.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = normalizeLocalizedString(geoviewLayerConfig.geoviewLayerName)!;
    this.metadataAccessPath = normalizeLocalizedString(geoviewLayerConfig.metadataAccessPath)!;
    this.serviceDateFormat = (geoviewLayerConfig.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (geoviewLayerConfig.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.initialSettings = Cast<TypeLayerInitialSettings>(
      defaultsDeep(geoviewLayerConfig.initialSettings, CV_DEFAULT_LAYER_INITIAL_SETTINGS)
    );
    this.listOfLayerEntryConfig = (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray)
      .map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig))
          return new GroupLayerEntryConfig(subLayerConfig, geoviewLayerConfig.initialSettings, this);
        return this.createLeafNode(subLayerConfig, geoviewLayerConfig.initialSettings, this);
      })
      .filter((subLayerConfig) => {
        return subLayerConfig;
      }) as ConfigBaseClass[];
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate an AbstractGeoviewLayerConfig object. The interaction with the instance will use the provided
   * language. The language associated to a configuration can be changed using the setConfigLanguage.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   * /
  static abstract async getInstance(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    mapFeaturesConfig?: MapFeaturesConfig
  ): Promise<AbstractGeoviewLayerConfig | undefined>;

  /**
   * @protected Process layer metadata.
   */
  protected abstract processMetadata(): void;

  /**
   * @protected Set the default value when a class property that has a default value is left undefined.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration affected.
   */
  protected abstract setDefaultValues(): void;

  /**
   * @protected validate
   * Validate the object properties.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration to validate.
   */
  validate(layerConfig: TypeJsonObject): void {
    if (!layerConfig.geoviewLayerName)
      logger.logError(`Property geoviewLayerName is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
    if (!layerConfig.geoviewLayerType)
      logger.logError(`Property geoviewLayerType is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
  }

  /**
   * The getter method that returns the geoview layer type property.
   *
   * @returns {TypeGeoviewLayerType} The GeoView layer type.
   * @abstract
   */
  abstract get geoviewLayerType(): TypeGeoviewLayerType;

  /**
   * The getter method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @abstract
   */
  abstract get geoviewLayerSchema(): string;

  /**
   * The method used to implement the class factory model that returns the instance of the class
   * based on the sub layer type needed.
   *
   * @param {TypeJsonObject} layerConfig The sub layer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig} geoviewInstance The GeoView instance that owns the sub layer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {ConfigBaseClass | undefined} The sub layer instance or undefined if there is an error.
   */
  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings | TypeJsonObject,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ): ConfigBaseClass | undefined;

  /**
   * Methode used to propagate the error flag to the AbstractGeoviewLayerConfig instance and the
   * MapFeaturesConfig instance if it exists.
   */
  propagateError(): void {
    this.#errorDetected = true;
    this.#mapFeaturesConfig?.propagateError();
  }
}
