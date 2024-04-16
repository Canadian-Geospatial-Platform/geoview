import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { logger } from 'geoview-core/src/core/utils/logger';
import { generateId } from 'geoview-core/src/core/utils/utilities';
import { TypeGeoviewLayerType, TypeJsonArray, TypeJsonObject } from '../../config-types';
import { ConfigBaseClass } from '../sub-layer-config/config-base-class';
import { TypeLayerInitialSettings, TypeLocalizedString } from '../../map-schema-types';
import { layerEntryIsGroupLayer } from '../../type-guards';
import { GroupLayerEntryConfig } from '../sub-layer-config/group-layer-entry-config';
import { MapFeaturesConfig } from '../map-features-config';
import { CV_DEFAULT_INITIAL_SETTINGS } from '../../config-constants';

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
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

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeJsonObject, mapFeaturesConfig?: MapFeaturesConfig) {
    this.#mapFeaturesConfig = mapFeaturesConfig;
    const layerConfigWithDefault = this.#setDefaultValues(layerConfig);

    this.geoviewLayerId = (layerConfigWithDefault.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = { ...(layerConfigWithDefault.geoviewLayerName as object) } as TypeLocalizedString;
    this.metadataAccessPath = { ...(layerConfigWithDefault.metadataAccessPath as object) } as TypeLocalizedString;
    this.serviceDateFormat = (layerConfigWithDefault.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (layerConfigWithDefault.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.initialSettings = { ...(layerConfigWithDefault.initialSettings as object) } as TypeLayerInitialSettings;
    this.createListOfLayerEntryConfig((layerConfigWithDefault.listOfLayerEntryConfig || []) as TypeJsonArray);
  }

  /**
   * @private setDefaultValues
   * Set the default value when a class property that has a default value is left undefined.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration affected.
   */
  #setDefaultValues(layerConfig: TypeJsonObject): TypeJsonObject {
    const layerConfigWithDefault = cloneDeep(layerConfig);
    layerConfigWithDefault.geoviewLayerType = this.geoviewLayerType as TypeJsonObject;
    layerConfigWithDefault.initialSettings = defaultsDeep(layerConfig.initialSettings, CV_DEFAULT_INITIAL_SETTINGS);
    return layerConfigWithDefault;
  }

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
   * Create the list of layer entries using the configuration provided.
   *
   * @param {TypeJsonObject} listOfJsonLayerConfig The list of layer entries to create.
   */
  createListOfLayerEntryConfig(listOfJsonLayerConfig: TypeJsonArray): void {
    this.listOfLayerEntryConfig = listOfJsonLayerConfig.map((jsonLayerConfig) => {
      if (layerEntryIsGroupLayer(jsonLayerConfig)) {
        return new GroupLayerEntryConfig(jsonLayerConfig, this.initialSettings, this);
      }
      return this.createLeafNode(jsonLayerConfig, this.initialSettings, this)!;
    });
  }

  /**
   * The getter method that returns the geoview layer type property.
   *
   * @returns {TypeGeoviewLayerType} The GeoView layer type.
   */
  abstract get geoviewLayerType(): TypeGeoviewLayerType;

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
