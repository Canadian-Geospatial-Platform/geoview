import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TypeJsonObject } from '@/core/types/global-types';
import { GroupLayerEntryConfig } from './group-layer-entry-config';

/** ******************************************************************************************************************************
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

  /** The ending extension (element) of the layer identifier. This element is part of the schema. */
  layerIdExtension?: string;

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

  /** Flag indicating that the loaded signal arrived before the processed one */
  #waitForProcessedBeforeSendingLoaded = false;

  // Keep all callback delegates references
  #onLayerStatusChangedHandlers: LayerStatusChangedDelegate[] = [];

  // TODO: Review - The status. I think we should have: newInstance, processsing, loading, - loaded : error
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
    // TODO: Refactor - Get rid of this Object.assign pattern here and elsewhere unless explicitely commented why.
    Object.assign(this, layerConfig);
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
   * Sets the layer status and emits an event when changed.
   * @param {string} newLayerStatus - The new layerId value.
   */
  // TODO: Refactor - Change this from a 'setter' to an actual set function, arguably too complex for just a 'setter'
  set layerStatus(newLayerStatus: TypeLayerStatus) {
    if (
      newLayerStatus === 'loaded' &&
      !layerEntryIsGroupLayer(this) &&
      !this.isGreaterThanOrEqualTo('loading') &&
      !this.#waitForProcessedBeforeSendingLoaded
    ) {
      this.#waitForProcessedBeforeSendingLoaded = true;
      return;
    }
    if (!this.isGreaterThanOrEqualTo(newLayerStatus)) {
      // eslint-disable-next-line no-underscore-dangle
      this._layerStatus = newLayerStatus;
      this.#emitLayerStatusChanged({ layerStatus: newLayerStatus });
    }
    if (newLayerStatus === 'processed' && this.#waitForProcessedBeforeSendingLoaded) this.layerStatus = 'loaded';

    // GV For quick debug, uncomment the line
    // if (newLayerStatus === 'error') debugger;

    // TODO: Cleanup - Commenting this and leaving it here for now.. It turns out that the parentLayerConfig property can't be trusted
    // GV due to a bug with different instances of entryconfigs stored in the objects and depending how you navigate the objects, you get
    // GV different instances. Example below (where 'parentLayerConfig.listOfLayerEntryConfig[0]' is indeed going back to 'uniqueValueId/uniqueValueId/4')
    // GV This: cgpv.api.getMapViewer['sandboxMap'].layer.getLayerEntryConfig('uniqueValueId/uniqueValueId/4').layerStatus
    // GV Isn't the same as this: cgpv.api.getMapViewer['sandboxMap'].layer.getLayerEntryConfig('uniqueValueId/uniqueValueId/4').parentLayerConfig.listOfLayerEntryConfig[0].layerStatus
    // Commenting this out until a fix is found..

    // // eslint-disable-next-line no-underscore-dangle
    // if (this._layerStatus === 'loaded' && this.parentLayerConfig) {
    //   // If all children of the parent are loaded, set the parent as loaded
    //   if (ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('loaded', this.parentLayerConfig.listOfLayerEntryConfig)) {
    //     // Set the parent as loaded
    //     this.parentLayerConfig.layerStatus = 'loaded';
    //   }
    // }
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
    if (pathEnding === undefined)
      pathEnding =
        layerConfig.layerIdExtension === undefined ? layerConfig.layerId : `${layerConfig.layerId}.${layerConfig.layerIdExtension}`;
    if (!layerConfig.parentLayerConfig) return `${layerConfig.geoviewLayerConfig!.geoviewLayerId!}/${pathEnding}`;
    return this.#evaluateLayerPath(
      layerConfig.parentLayerConfig as GroupLayerEntryConfig,
      `${(layerConfig.parentLayerConfig as GroupLayerEntryConfig).layerId}/${pathEnding}`
    );
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
      layerIdExtension: this.layerIdExtension,
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
    throw new Error(`Not implemented exception onClone on layer path ${this.layerPath}`);
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
      return !layerConfig.isGreaterThanOrEqualTo(layerStatus || 'newInstance');
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
 * Define a delegate for the event handler function signature.
 */
type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent, void>;

/**
 * Define an event for the delegate.
 */
export type LayerStatusChangedEvent = {
  // The new layer status.
  layerStatus: TypeLayerStatus;
};
