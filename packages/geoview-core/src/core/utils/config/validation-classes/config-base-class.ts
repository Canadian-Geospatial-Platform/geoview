import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  layerEntryIsGroupLayer,
} from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { LAYER_STATUS } from '@/core/utils/constant';
import { GroupLayerEntryConfig } from './group-layer-entry-config';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';
import { DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';

/**
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export abstract class ConfigBaseClass {
  /** The identifier of the layer to display on the map. This element is part of the schema. */
  // GV Cannot put it #layerId as it breaks things
  // eslint-disable-next-line no-restricted-syntax
  private _layerId = '';

  /** The layer path to this instance. */
  // GV Cannot put it #layerPath as it breaks things
  // eslint-disable-next-line no-restricted-syntax
  private _layerPath = '';

  /** It is used to identified unprocessed layers and shows the final layer state */
  // GV Cannot put it #layerStatus as it breaks things
  // eslint-disable-next-line no-restricted-syntax
  private _layerStatus: TypeLayerStatus = 'newInstance';

  /** The display name of the layer (English/French). */
  layerName?: string;

  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  schemaTag?: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  entryType?: TypeLayerEntryType;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig = {} as TypeGeoviewLayerConfig;

  /** The min scale that can be reach by the layer. */
  minScale?: number;

  /** The max scale that can be reach by the layer. */
  maxScale?: number;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings = {};

  /** It is used internally to distinguish layer groups derived from the
   * metadata. */
  isMetadataLayerGroup?: boolean;

  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig?: GroupLayerEntryConfig;

  // Keep all callback delegates references
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
   * @param {ConfigBaseClass} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: ConfigBaseClass) {
    // TODO: Refactor - Get rid of this Object.assign pattern here and work with the actual objects that
    // TO.DOCONT: are being sent in the constructor (it's not ConfigBaseClass objects that are in reality being
    // TO.DOCONT: sent in the constructor here, they are regular 'json' objects..).
    // TO.DOCONT: Because of this, we have to jump around between class instance and objects here...

    // Keep the layer status
    const { layerStatus } = layerConfig;

    // Delete the layer status from the property so that it can go through the Object.assign without failing..
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-param-reassign
    delete (layerConfig as any).layerStatus;

    // Transfert the properties from the object to the class ( bad practice :( )
    Object.assign(this, layerConfig);

    // Set back the layer status as it was
    if (layerStatus) this.setLayerStatus(layerStatus);

    // eslint-disable-next-line no-underscore-dangle
    if (this.geoviewLayerConfig) this._layerPath = ConfigBaseClass.#evaluateLayerPath(layerConfig);
    else logger.logError("Couldn't calculate layerPath because geoviewLayerConfig has an invalid value");
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
    // eslint-disable-next-line no-underscore-dangle
    this._layerPath = ConfigBaseClass.#evaluateLayerPath(this);
  }

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   * @returns {string} The layer path
   */
  get layerPath(): string {
    // eslint-disable-next-line no-underscore-dangle
    this._layerPath = ConfigBaseClass.#evaluateLayerPath(this);
    // eslint-disable-next-line no-underscore-dangle
    return this._layerPath;
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
   * Returns the sibling layer configurations of the current layer.
   * If the current layer has a parent, this method retrieves all layer entry
   * configs under the same parent. It can optionally exclude layers of type 'group'.
   * @param {boolean} includeGroups - Whether to include entries of type 'group' in the result. False by default.
   * @returns {ConfigBaseClass[]} An array of sibling layer configurations. Returns an empty array if there is no parent.
   */
  getSiblings(includeGroups: boolean = false): ConfigBaseClass[] {
    // If there's a parent
    if (this.parentLayerConfig) {
      return this.parentLayerConfig.listOfLayerEntryConfig.filter((config) => includeGroups || config.entryType !== 'group');
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
      // Set the parent layer status as loaded
      currentConfig.parentLayerConfig.setLayerStatusLoading();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(currentConfig.parentLayerConfig);
      return;
    }

    // Get all siblings which are in loaded
    const siblingsInLoaded = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'loaded');

    // If all siblings are loaded
    if (siblings.length === siblingsInLoaded.length) {
      // Set the parent layer status as loaded
      currentConfig.parentLayerConfig.setLayerStatusLoaded();
      // Continue with the parent
      ConfigBaseClass.#updateLayerStatusParentRec(currentConfig.parentLayerConfig);
      return;
    }

    // Get all siblings which are in error
    const siblingsInError = siblings.filter((lyrConfig) => lyrConfig.layerStatus === 'error');

    // If all siblings are in fact in error
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
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   *
   * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
   *
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return ConfigBaseClass.#layerStatusWeight[this.layerStatus] >= ConfigBaseClass.#layerStatusWeight[layerStatus];
  }

  /**
   * Serializes the ConfigBaseClass class
   * @returns {TypeJsonObject} The serialized ConfigBaseClass
   */
  serialize(): TypeJsonObject {
    // Redirect
    return this.onSerialize();
  }

  /**
   * Overridable function to serialize a ConfigBaseClass
   * @returns {TypeJsonObject} The serialized ConfigBaseClass
   */
  onSerialize(): TypeJsonObject {
    return {
      layerName: this.layerName,
      layerId: this.layerId,
      schemaTag: this.schemaTag,
      entryType: this.entryType,
      layerStatus: this.layerStatus,
      isMetadataLayerGroup: this.isMetadataLayerGroup,
    } as unknown as TypeJsonObject;
  }

  /**
   * Clones the configuration class.
   *
   * @returns {ConfigBaseClass} The cloned ConfigBaseClass object.
   */
  clone(): ConfigBaseClass {
    // Redirect to clone the object and return it
    return this.onClone();
  }

  /**
   * Overridable function to clone a child of a ConfigBaseClass.
   *
   * @returns {ConfigBaseClass} The cloned child object of a ConfigBaseClass.
   */
  protected onClone(): ConfigBaseClass {
    // Crash on purpose.
    // GV Make sure to implement a 'protected override onClone(): ConfigBaseClass' in the child-class to
    // GV use this cloning feature. See OgcWMSLayerEntryConfig for example.
    throw new NotImplementedError(`Not implemented exception onClone on layer path ${this.layerPath}`);
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
}

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
