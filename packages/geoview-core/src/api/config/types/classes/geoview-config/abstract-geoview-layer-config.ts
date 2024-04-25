// import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { TypeGeoviewLayerType, TypeJsonObject } from '@config/types/config-types';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { TypeDisplayLanguage, TypeLayerInitialSettings, TypeLocalizedString } from '@config/types/map-schema-types';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';
import { normalizeLocalizedString } from '@/api/config/utils';

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
  /** The language used when interacting with this instance of MapFeaturesConfig. */
  #language;

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
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  // GV: This class cannot be instanciated using its constructor. The static method getInstance must be used.
  // GV: The 'protected' keyword is used to prevent users from calling directly the constructor. We do that because
  // GV: a constructor cannot return a promise. That's the reason why we need the getInstance which can do that.
  protected constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeaturesConfig?: MapFeaturesConfig) {
    const clonedLayerConfig = cloneDeep(layerConfig);
    this.#mapFeaturesConfig = mapFeaturesConfig;
    this.#language = language;

    this.geoviewLayerId = (clonedLayerConfig.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = normalizeLocalizedString(clonedLayerConfig.geoviewLayerName)!;
    this.metadataAccessPath = normalizeLocalizedString(clonedLayerConfig.metadataAccessPath)!;
    this.serviceDateFormat = (clonedLayerConfig.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (clonedLayerConfig.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.initialSettings = { ...(clonedLayerConfig.initialSettings as object) } as TypeLayerInitialSettings;
    this.listOfLayerEntryConfig = [];
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
  abstract getGeoviewLayerSchema(): string;

  /**
   * The method used to implement the class factory model that returns the instance of the class
   * based on the sub layer type needed.
   *
   * @param {TypeJsonObject} layerConfig The sub layer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig} geoviewInstance The GeoView instance that owns the sub layer.
   *
   * @returns {ConfigBaseClass | undefined} The sub layer instance or undefined if there is an error.
   */
  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewConfig: AbstractGeoviewLayerConfig
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
