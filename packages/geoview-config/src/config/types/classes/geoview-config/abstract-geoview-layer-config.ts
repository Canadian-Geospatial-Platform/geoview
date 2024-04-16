import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { logger } from '../../../../logger';
import { generateId } from '../../../../utilities';
import { Cast, TypeGeoviewLayerType, TypeJsonArray, TypeJsonObject } from '../../config-types';
import { ConfigBaseClass } from '../layer-tree-config/config-base-class';
import { TypeLayerInitialSettings, TypeLocalizedString } from '../../map-schema-types';
import { layerEntryIsGroupLayer } from '../../type-guards';
import { GroupLayerEntryConfig } from '../layer-tree-config/group-layer-entry-config';
import { MapFeaturesConfig } from '../map-features-config';
import { DEFAULT_INITIAL_SETTINGS } from '../../config-constants';

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
    this.#validate(layerConfig);

    this.geoviewLayerId = (layerConfigWithDefault.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = Cast<TypeLocalizedString>(layerConfigWithDefault.geoviewLayerName);
    this.metadataAccessPath = Cast<TypeLocalizedString>(layerConfigWithDefault.metadataAccessPath);
    this.serviceDateFormat = (layerConfigWithDefault.geoviewLayerId || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (layerConfigWithDefault.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.initialSettings = Cast<TypeLayerInitialSettings>(layerConfigWithDefault.initialSettings);
    this.createListOfLayerEntryConfig((layerConfigWithDefault.listOfLayerEntryConfig || []) as TypeJsonArray);
  }

  #setDefaultValues(layerConfig: TypeJsonObject): TypeJsonObject {
    const layerConfigWithDefault = cloneDeep(layerConfig);
    layerConfigWithDefault.geoviewLayerType = this.geoviewLayerType as TypeJsonObject;
    layerConfigWithDefault.initialSettings = defaultsDeep(layerConfig.initialSettings, DEFAULT_INITIAL_SETTINGS);
    return layerConfigWithDefault;
  }

  #validate(layerConfig: TypeJsonObject): void {
    if (!layerConfig.geoviewLayerName)
      logger.logError(`Property geoviewLayerName is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
    if (!layerConfig.geoviewLayerType)
      logger.logError(`Property geoviewLayerType is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
  }

  createListOfLayerEntryConfig(listOfJsonLayerConfig: TypeJsonArray): void {
    this.listOfLayerEntryConfig = listOfJsonLayerConfig.map((jsonLayerConfig) => {
      if (layerEntryIsGroupLayer(jsonLayerConfig)) {
        return new GroupLayerEntryConfig(jsonLayerConfig, this.initialSettings, this);
      }
      return this.createLeafNode(jsonLayerConfig, this.initialSettings, this)!;
    });
  }

  /** Type of GeoView layer. */
  abstract get geoviewLayerType(): TypeGeoviewLayerType;

  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewConfig: AbstractGeoviewLayerConfig
  ): ConfigBaseClass | undefined;

  propagateError(): void {
    this.#errorDetected = true;
    this.#mapFeaturesConfig?.propagateError();
  }
}
