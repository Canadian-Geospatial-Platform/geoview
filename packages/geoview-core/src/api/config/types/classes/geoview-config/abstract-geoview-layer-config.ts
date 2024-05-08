import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeGeoviewLayerType, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { normalizeLocalizedString } from '@config/utils';
import { CV_CONST_SUB_LAYER_TYPES, CV_DEFAULT_LAYER_INITIAL_SETTINGS } from '@config/types/config-constants';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';

/**
 *  Base class for the definition of a Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject;

  /** If the geoview layer is linked to a map config, we keep a reference to the map for message propagation */
  #mapFeatureConfig?: MapFeatureConfig;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
   * information.
   */
  geoviewLayerName: string;

  /** The GeoView layer access path (English/French). */
  metadataAccessPath: string;

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
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeatureConfig?: MapFeatureConfig) {
    this.#originalgeoviewLayerConfig = cloneDeep(geoviewLayerConfig);
    this.#mapFeatureConfig = mapFeatureConfig;
    this.#language = language;

    // Topmost layer must be a layer group or a leaf node.
    if ((this.#originalgeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray).length > 1)
      (this.#originalgeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray) = [
        {
          layerId: this.#originalgeoviewLayerConfig.geoviewLayerId,
          initialSettings: defaultsDeep(this.#originalgeoviewLayerConfig.initialSettings, CV_DEFAULT_LAYER_INITIAL_SETTINGS),
          layerName: { ...(this.#originalgeoviewLayerConfig.geoviewLayerName as object) },
          entryType: CV_CONST_SUB_LAYER_TYPES.GROUP as TypeJsonObject,
          listOfLayerEntryConfig: this.#originalgeoviewLayerConfig.listOfLayerEntryConfig,
        },
      ];

    this.geoviewLayerId = (this.#originalgeoviewLayerConfig.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = normalizeLocalizedString(this.#originalgeoviewLayerConfig.geoviewLayerName)![this.#language]!;
    this.metadataAccessPath = normalizeLocalizedString(this.#originalgeoviewLayerConfig.metadataAccessPath)![this.#language]!;
    this.serviceDateFormat = (this.#originalgeoviewLayerConfig.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (this.#originalgeoviewLayerConfig.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.initialSettings = Cast<TypeLayerInitialSettings>(
      defaultsDeep(this.#originalgeoviewLayerConfig.initialSettings, CV_DEFAULT_LAYER_INITIAL_SETTINGS)
    );
    this.listOfLayerEntryConfig = (this.#originalgeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray)
      .map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig)) return new GroupLayerEntryConfig(subLayerConfig, this.initialSettings, language, this);
        return this.createLeafNode(subLayerConfig, this.initialSettings, language, this);
      })
      .filter((subLayerConfig) => {
        return subLayerConfig;
      }) as ConfigBaseClass[];
  }

  /**
   * Validate the object properties. Layer name and type must be set.
   * @private
   */
  protected validate(): void {
    if (!this.geoviewLayerName) {
      logger.logError(`Property geoviewLayerName is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
      this.propagateError();
    }
    if (!this.geoviewLayerType) {
      logger.logError(`Property geoviewLayerType is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
      this.propagateError();
    }
  }

  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   * @protected @abstract
   */
  protected abstract getServiceMetadata(): void;

  /**
   * The getter method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  protected abstract get geoviewLayerSchema(): string;

  /**
   * The getter method that returns the geoview layer type to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  abstract get geoviewLayerType(): TypeGeoviewLayerType;

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {ConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
   * @abstract
   */
  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ): ConfigBaseClass | undefined;

  /**
   * Methode used to propagate the error flag to the AbstractGeoviewLayerConfig instance and the
   * MapFeatureConfig instance if it exists.
   */
  propagateError(): void {
    // this.#errorDetected = true;
    this.#mapFeatureConfig?.propagateError();
  }

  /**
   * The getter method that returns the isValid flag (true when the map feature config is valid).
   *
   * @returns {boolean} The isValid property associated to map feature config.
   */
  get isValid(): boolean {
    return !this.#errorDetected;
  }
}
