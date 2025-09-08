import { cloneDeep } from 'lodash';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { Extent } from '@/api/config/types/map-schema-types';
import {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeTileGrid,
  TypeValidSourceProjectionCodes,
  layerEntryIsGroupLayer,
} from '@/api/config/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';
import { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from './group-layer-entry-config';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';
import { DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

export interface ConfigBaseClassProps {
  /** The display name of the layer (English/French). */
  schemaTag?: TypeGeoviewLayerType; // This property isn't necessary in the config as the class handles them, but we have it explicit here for the ConfigClassOrType thing.
  entryType?: TypeLayerEntryType; // This property isn't necessary in the config as the class handles them, but we have it explicit here for the ConfigClassOrType thing.
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
  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  // GV Cannot put it #schemaTag as it breaks things
  abstract schemaTag: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  // GV Cannot put it #entryType as it breaks things
  abstract entryType: TypeLayerEntryType;

  /** The layer entry properties used to create the layer entry config */
  layerEntryProps: ConfigBaseClassProps;

  /** The identifier of the layer to display on the map. This element is part of the schema. */
  // GV Cannot put it #entryType as it breaks things
  // TODO: This should be #layerId. We should use getLayerId() and setLayerId() instead and fix the issues that come up when doing so. Same with other attributes.
  layerId: string;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig: TypeGeoviewLayerConfig;

  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig: GroupLayerEntryConfig | undefined;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings;

  /** The display name of the layer. */
  #layerName?: string;

  /** It is used to identified unprocessed layers and shows the final layer state */
  #layerStatus: TypeLayerStatus = 'newInstance';

  /** The min scale that can be reach by the layer. */
  #minScale?: number;

  /** The max scale that can be reach by the layer. */
  #maxScale?: number;

  /** It is used internally to distinguish layer groups derived from the metadata. */
  #isMetadataLayerGroup: boolean;

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
   * @param {ConfigClassOrType} layerConfig - The layer configuration we want to instanciate.
   */
  // TODO: Refactor - There is an oddity inside LayerApi.addGeoviewLayer to the effect that it's calling validateListOfGeoviewLayerConfig even if it was already called in config-validation.
  // TO.DOCONT: Until this is fixed, this constructor supports sending a ConfigBaseClass in its typing, for now (ConfigClassOrType = ConfigBaseClassProps | ConfigBaseClass)... though it should only be a ConfigBaseClassProps eventually.
  protected constructor(layerConfig: ConfigClassOrType) {
    // Keep attribute properties
    if (layerConfig instanceof ConfigBaseClass) {
      this.layerEntryProps = layerConfig.layerEntryProps;
    } else {
      // Regular
      this.layerEntryProps = layerConfig;
    }

    // Transfert the properties from the object to the class (without using Object.assign anymore)
    this.layerId = layerConfig.layerId;
    this.#layerName = ConfigBaseClass.getClassOrTypeLayerName(layerConfig);
    this.geoviewLayerConfig = layerConfig.geoviewLayerConfig;
    this.parentLayerConfig = layerConfig.parentLayerConfig;
    this.initialSettings = layerConfig.initialSettings ?? {};
    this.#minScale = ConfigBaseClass.getClassOrTypeMinScale(layerConfig);
    this.#maxScale = ConfigBaseClass.getClassOrTypeMaxScale(layerConfig);
    this.#isMetadataLayerGroup = ConfigBaseClass.getClassOrTypeIsMetadataLayerGroup(layerConfig);
  }

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   * @returns {string} The layer path
   */
  get layerPath(): string {
    return ConfigBaseClass.#evaluateLayerPath(this);
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   * @retuns {TypeLayerStatus} The layer status
   */
  get layerStatus(): TypeLayerStatus {
    return this.#layerStatus;
  }

  /**
   * Gets the layer name of the entry layer or
   * fallbacks on the geoviewLayerName from the GeoViewLayerConfig or
   * fallbacks on the geoviewLayerId from the GeoViewLayerConfig or
   * fallsback on the layerPath.
   */
  getLayerNameCascade(): string {
    return this.#layerName || this.geoviewLayerConfig.geoviewLayerName || this.geoviewLayerConfig.geoviewLayerId || this.layerPath;
  }

  /**
   * Gets the layer name of the entry layer if any.
   */
  getLayerName(): string | undefined {
    return this.#layerName;
  }

  /**
   * Sets the layer name of the entry layer.
   * @param {string} layerName - The layer name.
   */
  setLayerName(layerName: string): void {
    this.#layerName = layerName;
  }

  /**
   * Type guard that checks if this entry is a group layer entry.
   * @returns {boolean} True if this is a GroupLayerEntryConfig.
   */
  getEntryTypeIsGroup(): this is GroupLayerEntryConfig {
    return layerEntryIsGroupLayer(this);
  }

  /**
   * Gets the layer indication for the metadata layer group.
   */
  getIsMetadataLayerGroup(): boolean {
    return this.#isMetadataLayerGroup;
  }

  /**
   * Sets the layer is metadata layer group indication.
   * @param {boolean} isMetadataLayerGroup - The indication if it's a metadata layer group.
   */
  setIsMetadataLayerGroup(isMetadataLayerGroup: boolean): void {
    this.#isMetadataLayerGroup = isMetadataLayerGroup;
  }

  /**
   * Type guard that checks if this entry is a regular layer entry (not a group layer entry).
   * @returns {boolean} True if this is a AbstractBaseLayerEntryConfig.
   */
  getEntryTypeIsRegular(): this is AbstractBaseLayerEntryConfig {
    return !this.getEntryTypeIsGroup();
  }

  /**
   * Gets the layer min scale if any.
   * @returns {number | undefined} The layer min scale if any.
   */
  getMinScale(): number | undefined {
    return this.#minScale;
  }

  /**
   * Sets the layer min scale.
   * @param {number?} minScale - The layer min scale or undefined.
   */
  setMinScale(minScale?: number): void {
    this.#minScale = minScale;
  }

  /**
   * Gets the layer max scale if any.
   * @returns {number | undefined} The layer max scale if any.
   */
  getMaxScale(): number | undefined {
    return this.#maxScale;
  }

  /**
   * Sets the layer max scale.
   * @param {number?} maxScale - The layer max scale or undefined.
   */
  setMaxScale(maxScale?: number): void {
    this.#maxScale = maxScale;
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
   * Sets the data access path for this layer entry.
   * This is the public entry point for updating the data access path.
   * Internally, it delegates the behavior to the `onSetDataAccessPath` method,
   * which can be overridden by subclasses to implement custom logic.
   * @param {string} dataAccessPath - The new path to be used for accessing data.
   */
  setDataAccessPath(dataAccessPath: string): void {
    // Redirect
    this.onSetDataAccessPath(dataAccessPath);
  }

  /**
   * Overridable method to apply the data access path to this layer entry and its children.
   * Subclasses should override this method to implement the logic needed
   * to update the data access path on the current layer entry, including
   * any recursive behavior for child entries or associated sources.
   * @param {string} dataAccessPath - The data access path to set.
   * @protected
   * @abstract
   */
  protected abstract onSetDataAccessPath(dataAccessPath: string): void;

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
      this.#layerStatus = newLayerStatus;

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
    // Redirect
    return this.onCloneLayerProps();
  }

  /**
   * Overridable function to create and return a deep clone of the layer entry configuration properties.
   * This method returns a cloned copy of the original properties (`layerEntryProps`)
   * that were used to create this layer entry configuration. Modifying the returned
   * object will not affect the internal state of the layer.
   * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
   */
  protected onCloneLayerProps(): ConfigBaseClassProps {
    // Return a cloned copy of the layer entry props that were used to create this layer entry config
    return cloneDeep(this.layerEntryProps);
  }

  /**
   * Writes the instance as Json.
   * @returns {T} The Json representation of the instance.
   */
  toJson<T>(): T {
    // Redirect
    return this.onToJson();
  }

  /**
   * Overridable function to write the instance as Json.
   * @returns {unknown} The Json representation of the instance.
   * @protected
   */
  protected onToJson<T>(): T {
    return {
      schemaTag: this.schemaTag,
      entryType: this.entryType,
      layerId: this.layerId,
      layerName: this.getLayerName(),
      isMetadataLayerGroup: this.getIsMetadataLayerGroup(),
    } as T;
  }

  /**
   * Converts the current layer config instance into a `GroupLayerEntryConfigProps` object.
   * This method serializes the current layer into a configuration object used
   * to represent a group layer within a GeoView configuration. It populates
   * essential properties such as the layer ID, name, configuration references,
   * and initializes it as a metadata layer group.
   * @param {string?} name - The layer name. Will use this.getLayerName() when undefined.
   * @returns {GroupLayerEntryConfigProps} The configuration object representing the group layer.
   */
  toGroupLayerConfig(name?: string): GroupLayerEntryConfigProps {
    const groupLayerProps = this.toJson<GroupLayerEntryConfigProps>();
    groupLayerProps.layerId = this.layerId;
    groupLayerProps.layerName = name || this.getLayerName();
    groupLayerProps.geoviewLayerConfig = this.geoviewLayerConfig;
    groupLayerProps.parentLayerConfig = this.parentLayerConfig;
    groupLayerProps.isMetadataLayerGroup = true;
    groupLayerProps.listOfLayerEntryConfig = [];
    return groupLayerProps;
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

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer name or undefined.
   */
  static getClassOrTypeLayerName(layerConfig: ConfigClassOrType | undefined): string | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getLayerName();
    }
    return layerConfig?.layerName;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {number | undefined} The minimum scale or undefined.
   */
  static getClassOrTypeMinScale(layerConfig: ConfigClassOrType | undefined): number | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getMinScale();
    }
    return layerConfig?.minScale;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {number} minScale - The minimum scale to apply.
   */
  static setClassOrTypeMinScale(layerConfig: ConfigClassOrType, minScale: number): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setMinScale(minScale);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.minScale = minScale;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {number | undefined} The maximum scale or undefined.
   */
  static getClassOrTypeMaxScale(layerConfig: ConfigClassOrType | undefined): number | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getMaxScale();
    }
    return layerConfig?.maxScale;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {number} maxScale - The maximum scale to apply.
   */
  static setClassOrTypeMaxScale(layerConfig: ConfigClassOrType, maxScale: number): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setMaxScale(maxScale);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.maxScale = maxScale;
    }
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {boolean} The indication if the layer config is metadata layer group.
   */
  static getClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType | undefined): boolean {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getIsMetadataLayerGroup();
    }
    return layerConfig?.isMetadataLayerGroup || false;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {boolean} isMetadataLayerGroup - The indication if the layer config is metadata layer group.
   */
  static setClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType, isMetadataLayerGroup: boolean): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setIsMetadataLayerGroup(isMetadataLayerGroup);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.isMetadataLayerGroup = isMetadataLayerGroup;
    }
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
  geoviewLayerConfig?: TypeGeoviewLayerConfig;
  listOfLayerEntryConfig?: TypeLayerEntryShell[]; // For the groups
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
