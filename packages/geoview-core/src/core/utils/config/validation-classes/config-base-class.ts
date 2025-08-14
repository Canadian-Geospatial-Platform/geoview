import { cloneDeep } from 'lodash';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  Extent,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeTileGrid,
  TypeValidSourceProjectionCodes,
  layerEntryIsEsriFeature,
  layerEntryIsGeoJSON,
  layerEntryIsGroupLayer,
} from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';
import { GroupLayerEntryConfig } from './group-layer-entry-config';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';
import { DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';
import { GeoJSONLayerEntryConfig } from './vector-validation-classes/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from './vector-validation-classes/esri-feature-layer-entry-config';

export interface ConfigBaseClassProps {
  /** The display name of the layer (English/French). */
  layerId: string;
  geoviewLayerConfig: TypeGeoviewLayerConfig;
  layerName?: string;
  initialSettings?: TypeLayerInitialSettings;
  minScale?: number;
  maxScale?: number;
  isMetadataLayerGroup?: boolean;
  parentLayerConfig?: GroupLayerEntryConfig;
}

/**
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export abstract class ConfigBaseClass {
  /** The layer entry properties used to create the layer entry config */
  layerEntryProps: ConfigBaseClassProps;

  /** The identifier of the layer to display on the map. This element is part of the schema. */
  // GV Cannot put it #layerId as it breaks things
  // eslint-disable-next-line no-restricted-syntax
  private _layerId = '';

  /** It is used to identified unprocessed layers and shows the final layer state */
  // GV Cannot put it #layerStatus as it breaks things
  // eslint-disable-next-line no-restricted-syntax
  private _layerStatus: TypeLayerStatus = 'newInstance';

  /** The display name of the layer (English/French). */
  layerName?: string;

  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  // GV Cannot put it #schemaTag as it breaks things
  abstract schemaTag: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  // GV Cannot put it #entryType as it breaks things
  abstract entryType: TypeLayerEntryType;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig = {} as TypeGeoviewLayerConfig;

  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig: GroupLayerEntryConfig | undefined;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings;

  /** The min scale that can be reach by the layer. */
  minScale?: number;

  /** The max scale that can be reach by the layer. */
  maxScale?: number;

  /** It is used internally to distinguish layer groups derived from the metadata. */
  isMetadataLayerGroup: boolean;

  /** Keep all callback delegates references */
  #onLayerStatusChangedHandlers: LayerStatusChangedDelegate[] = [];

  // The layer status weigths
  static #layerStatusWeight = {
    newInstance: 10,
    registered: 20,
    processing: 30,
    processed: 40,
    loading: 50,
    loaded: 60,
    error: 70,
  };

  /**
   * The class constructor.
   * @param {ConfigBaseClassProps} layerConfig - The layer configuration we want to instanciate.
   */
  // TODO: Refactor - There is an oddity inside LayerApi.addGeoviewLayer to the effect that it's calling validateListOfGeoviewLayerConfig even if it was already called in config-validation.
  // TO.DOCONT: Until this is fixed, this constructor supports sending a ConfigBaseClass in its typing, for now (ConfigBaseClassProps | ConfigBaseClass)... though it should only be a ConfigBaseClassProps eventually.
  protected constructor(layerConfig: ConfigBaseClassProps | ConfigBaseClass) {
    // Keep attribute properties
    this.layerEntryProps = layerConfig;

    // Temporary, until refactor is done, support when a ConfigBaseClass is sent here..
    if (layerConfig instanceof ConfigBaseClass) this.layerEntryProps = layerConfig.layerEntryProps;

    // Transfert the properties from the object to the class (without using Object.assign anymore)
    this.layerId = layerConfig.layerId;
    this.layerName = layerConfig.layerName;
    // this.schemaTag = layerConfig.schemaTag;
    // this.entryType = layerConfig.entryType;
    this.geoviewLayerConfig = layerConfig.geoviewLayerConfig;
    this.parentLayerConfig = layerConfig.parentLayerConfig;
    this.minScale = layerConfig.minScale;
    this.maxScale = layerConfig.maxScale;
    this.initialSettings = layerConfig.initialSettings ?? {};
    this.isMetadataLayerGroup = layerConfig.isMetadataLayerGroup ?? false;
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   * @retuns {string} The layer id
   */
  get layerId(): string {
    // eslint-disable-next-line no-underscore-dangle
    return this._layerId;
  }

  /**
   * The layerId setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerId - The new layerId value.
   */
  set layerId(newLayerId: string) {
    // eslint-disable-next-line no-underscore-dangle
    this._layerId = newLayerId;
  }

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   * @returns {string} The layer path
   */
  get layerPath(): string {
    // eslint-disable-next-line no-underscore-dangle
    return ConfigBaseClass.#evaluateLayerPath(this);
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   * @retuns {TypeLayerStatus} The layer status
   */
  get layerStatus(): TypeLayerStatus {
    // eslint-disable-next-line no-underscore-dangle
    return this._layerStatus;
  }

  /**
   * Gets the layer name of the entry layer or
   * fallbacks on the geoviewLayerName from the GeoViewLayerConfig or
   * fallbacks on the geoviewLayerId from the GeoViewLayerConfig or
   * fallsback on the layerPath.
   */
  getLayerName(): string {
    return this.layerName || this.geoviewLayerConfig.geoviewLayerName || this.geoviewLayerConfig.geoviewLayerId || this.layerPath;
  }

  /**
   * Gets the entry type of the layer entry config.
   * @returns {TypeLayerEntryType} The entry type.
   */
  getEntryType(): TypeLayerEntryType {
    return this.entryType;
  }

  /**
   * Type guard that checks if this entry is a group layer entry.
   * @returns {boolean} True if this is a GroupLayerEntryConfig.
   */
  getEntryTypeIsGroup(): this is GroupLayerEntryConfig {
    return layerEntryIsGroupLayer(this);
  }

  /**
   * Type guard that checks if this entry is a regular layer entry (not a group layer entry).
   * @returns {boolean} True if this is a AbstractBaseLayerEntryConfig.
   */
  getEntryTypeIsRegular(): this is AbstractBaseLayerEntryConfig {
    return !this.getEntryTypeIsGroup();
  }

  /**
   * Gets the schema tag of the layer entry config.
   * @returns {TypeGeoviewLayerType} The schema tag.
   */
  getSchemaTag(): TypeGeoviewLayerType {
    return this.schemaTag;
  }

  /**
   * Type guard that checks if this entry is a GeoJSON schema tag layer entry.
   * @returns {GeoJSONLayerEntryConfig} True if this is a GeoJSONLayerEntryConfig.
   */
  getSchemaTagGeoJSON(): this is GeoJSONLayerEntryConfig {
    return layerEntryIsGeoJSON(this);
  }

  /**
   * Type guard that checks if this entry is a GeoJSON schema tag layer entry.
   * @returns {EsriFeatureLayerEntryConfig} True if this is a GeoJSONLayerEntryConfig.
   */
  getSchemaTagEsriFeature(): this is EsriFeatureLayerEntryConfig {
    return layerEntryIsEsriFeature(this);
  }

  /**
   * Returns the sibling layer configurations of the current layer.
   * If the current layer has a parent, this method retrieves all layer entry
   * configs under the same parent. It can optionally exclude layers of type 'group'.
   * @param {boolean} includeGroups - Whether to include entries of type 'group' in the result. False by default.
   * @returns {ConfigBaseClass[]} An array of sibling layer configurations. Returns an empty array if there is no parent.
   */
  getSiblings(includeGroups: boolean = false): ConfigBaseClass[] {
    // If there's a parent
    if (this.parentLayerConfig) {
      return this.parentLayerConfig.listOfLayerEntryConfig.filter((config) => includeGroups || !config.getEntryTypeIsGroup());
    }

    // No siblings
    return [];
  }

  /**
   * Gets the external fragments order if specified by the config, defaults to ISO_UTC.
   * @returns {TypeDateFragments} The Date Fragments
   */
  getExternalFragmentsOrder(): TypeDateFragments {
    return DateMgt.getDateFragmentsOrder(this.geoviewLayerConfig.externalDateFormat);
  }

  /**
   * Sets the layer status to registered.
   */
  setLayerStatusRegistered(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.REGISTERED);
  }

  /**
   * Sets the layer status to processing.
   */
  setLayerStatusProcessing(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.PROCESSING);
  }

  /**
   * Sets the layer status to processed.
   */
  setLayerStatusProcessed(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.PROCESSED);
  }

  /**
   * Sets the layer status to loading.
   */
  setLayerStatusLoading(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.LOADING);
  }

  /**
   * Sets the layer status to loaded.
   */
  setLayerStatusLoaded(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.LOADED);
  }

  /**
   * Sets the layer status to error.
   */
  setLayerStatusError(): void {
    // Redirect
    this.setLayerStatus(LAYER_STATUS.ERROR);
  }

  /**
   * Sets the layer status and emits an event when changed.
   * @param {string} newLayerStatus - The new layerId value.
   */
  setLayerStatus(newLayerStatus: TypeLayerStatus): void {
    // Log
    logger.logTraceCore('LAYERS STATUS -', this.layerPath, newLayerStatus);

    // GV For quick debug, uncomment the line
    // if (newLayerStatus === 'error') debugger;

    // Check if we're not accidentally trying to set a status less than the current one (or setting loading, it's allowed to jump between loading and loaded)
    if (!this.isGreaterThanOrEqualTo(newLayerStatus) || newLayerStatus === 'loading') {
      // eslint-disable-next-line no-underscore-dangle
      this._layerStatus = newLayerStatus;

      // Emit about it
      this.#emitLayerStatusChanged({ layerStatus: newLayerStatus });
    } else if (this.layerStatus !== newLayerStatus) {
      // Log the warning as this shouldn't be happening
      logger.logWarning(
        `The layer status for ${this.layerPath} was already '${this.layerStatus}' and the system wanted to set ${newLayerStatus}`
      );
    }
  }

  /**
   * Updates the status of all parents layers based on the status of their sibling layers.
   * This method checks the statuses of sibling layers (layers sharing the same parent).
   * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
   * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
   * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
   * - If neither condition is met, the parent status remains unchanged.
   */
  updateLayerStatusParent(): void {
    // Redirect
    ConfigBaseClass.#updateLayerStatusParentRec(this);
  }

  /**
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return ConfigBaseClass.#layerStatusWeight[this.layerStatus] >= ConfigBaseClass.#layerStatusWeight[layerStatus];
  }

  /**
   * Creates and returns a deep clone of the layer entry configuration properties.
   * This method returns a cloned copy of the original properties (`layerEntryProps`)
   * that were used to create this layer entry configuration. Modifying the returned
   * object will not affect the internal state of the layer.
   * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
   */
  cloneLayerProps(): ConfigBaseClassProps {
    // Return a cloned copy of the layer entry props that were used to create this layer entry config
    return cloneDeep(this.layerEntryProps);
  }

  /**
   * Writes the instance as Json.
   * @returns {unknown} The Json representation of the instance.
   */
  toJson(): unknown {
    // Redirect
    return this.onToJson();
  }

  /**
   * Overridable function to write the instance as Json.
   * @returns {unknown} The Json representation of the instance.
   * @protected
   */
  protected onToJson(): unknown {
    return {
      layerName: this.layerName,
      layerId: this.layerId,
      schemaTag: this.getSchemaTag(),
      entryType: this.getEntryType(),
      isMetadataLayerGroup: this.isMetadataLayerGroup,
    };
  }

  /**
   * Clones the configuration class.
   * @returns {ConfigBaseClass} The cloned ConfigBaseClass object.
   */
  clone(): ConfigBaseClass {
    // Redirect to clone the object and return it
    return this.onClone();
  }

  /**
   * Overridable function to clone a child of a ConfigBaseClass.
   * @returns {ConfigBaseClass} The cloned child object of a ConfigBaseClass.
   */
  protected onClone(): ConfigBaseClass {
    // Crash on purpose.
    // GV Make sure to implement a 'protected override onClone(): ConfigBaseClass' in the child-class to
    // GV use this cloning feature. See OgcWMSLayerEntryConfig for example.
    throw new NotImplementedError(`Not implemented exception onClone on layer path ${this.layerPath}`);
  }

  // #region STATIC

  /**
   * Recursively updates the status of the parent layer based on the status of its sibling layers.
   * This method checks the statuses of sibling layers (layers sharing the same parent).
   * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
   * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
   * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
   * - If neither condition is met, the parent status remains unchanged.
   */
  static #updateLayerStatusParentRec(currentConfig: ConfigBaseClass): void {
    // If there's no parent
    if (!currentConfig.parentLayerConfig) return;

    // Get all siblings of the layer
    const siblings = currentConfig.getSiblings(true);

    // Get all siblings which are in loading state
    const siblingsInLoading = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'loading');

    // If at least one layer is loading
    if (siblingsInLoading.length > 0) {
      // Set the parent layer status as loading
      currentConfig.parentLayerConfig.setLayerStatusLoading();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(currentConfig.parentLayerConfig);
      return;
    }

    // Get all siblings which are loaded
    const siblingsInLoaded = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'loaded');

    // If all siblings are loaded
    if (siblings.length === siblingsInLoaded.length) {
      // Set the parent layer status as loaded
      currentConfig.parentLayerConfig.setLayerStatusLoaded();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(currentConfig.parentLayerConfig);
      return;
    }

    // Get all siblings which are in error or loaded
    const siblingsInError = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'error' || lyrConfig.layerStatus === 'loaded');

    // If all siblings are in fact in error or loaded
    if (siblings.length === siblingsInError.length) {
      // Set the parent layer status as error
      currentConfig.parentLayerConfig.setLayerStatusError();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(currentConfig.parentLayerConfig);
    }
  }

  /**
   * Getter for the layer Path of the layer configuration parameter.
   * @param {ConfigBaseClass} layerConfig - The layer configuration for which we want to get the layer path.
   * @param {string} layerPath - Internal parameter used to build the layer path (should not be used by the user).
   *
   * @returns {string} Returns the layer path.
   */
  static #evaluateLayerPath(layerConfig: ConfigBaseClass, layerPath?: string): string {
    let pathEnding = layerPath;
    if (pathEnding === undefined) pathEnding = layerConfig.layerId;
    if (!layerConfig.parentLayerConfig) return `${layerConfig.geoviewLayerConfig.geoviewLayerId}/${pathEnding}`;
    return this.#evaluateLayerPath(layerConfig.parentLayerConfig, `${layerConfig.parentLayerConfig.layerId}/${pathEnding}`);
  }

  /**
   * Recursively checks the list of layer entries to see if all of them are greater than or equal to the provided layer status.
   *
   * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layer's configuration (default: this.listOfLayerEntryConfig).
   *
   * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
   */
  static allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus, listOfLayerEntryConfig: ConfigBaseClass[]): boolean {
    // Try to find a layer that is not greater than or equal to the layerStatus parameter. If you can, return false
    return !listOfLayerEntryConfig.find((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig))
        return !this.allLayerStatusAreGreaterThanOrEqualTo(layerStatus, layerConfig.listOfLayerEntryConfig);
      return !layerConfig.isGreaterThanOrEqualTo(layerStatus);
    });
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerStatusChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerStatusChanged(event: LayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  // #endregion
}

// #region TYPES

export type TypeLayerEntryShell = {
  id: number | string;
  name?: string;
  index?: number;
  layerId?: number | string;
  layerName?: string;
  tileGrid?: TypeTileGrid;
  subLayers?: TypeLayerEntryShell[];
  source?: TypeLayerEntryShellSource;
};

export type TypeLayerEntryShellSource = {
  dataAccessPath?: string;
  extent?: Extent;
  projection?: TypeValidSourceProjectionCodes;
};

// #endregion

// #region EVENT TYPES

/**
 * Define an event for the delegate.
 */
export type LayerStatusChangedEvent = {
  // The new layer status.
  layerStatus: TypeLayerStatus;
};

/**
 * Define a delegate for the event handler function signature.
 */
export type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent, void>;

// #endregion
