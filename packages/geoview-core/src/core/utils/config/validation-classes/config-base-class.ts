import { TypeLocalizedString } from '@config/types/map-schema-types';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerEntryType,
  TypeLayerStatus,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TypeJsonValue } from '@/core/types/global-types';
import { GroupLayerEntryConfig } from './group-layer-entry-config';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export class ConfigBaseClass {
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
  layerName?: TypeLocalizedString;

  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  schemaTag?: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  entryType?: TypeLayerEntryType;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig = {} as TypeGeoviewLayerConfig;

  /** It is used internally to distinguish layer groups derived from the
   * metadata. */
  isMetadataLayerGroup?: boolean;

  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig?: GroupLayerEntryConfig;

  /** Flag indicating that the loaded signal arrived before the processed one */
  #waitForProcessedBeforeSendingLoaded = false;

  // Keep all callback delegates references
  // TODO: refactor - if this handler is privare with #,  abstract-base-layer-entry-config.ts:28 Uncaught (in promise) TypeError: Private element is not present on this object
  // TD.CONT: this by pass the error, I need to set this public. The problem come from the groupLayer object trying to emit this event but
  // TD.CONT: the event is not define so this.onLayerStatus.... failed
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
   * @param {ConfigBaseClass} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ConfigBaseClass) {
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
   * @param {string} newLayerId The new layerId value.
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
    // TODO: Refactor - It would be better to not have a 'getter' that 'sets' a value at the same time.
    // TO.DOCONT: Unfortunately, when commenting this out (to rely on the one in layerId) things almost work, except for the Groups inside Groups which don't.
    // TO.DOCONT: The fix for this should be elsewhere and the line below commented out asap to prevent other issues like that.
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
   * The layerStatus setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerStatus The new layerId value.
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
      this.#emitLayerStatusChanged({ layerPath: this.layerPath, layerStatus: newLayerStatus });
    }
    if (newLayerStatus === 'processed' && this.#waitForProcessedBeforeSendingLoaded) this.layerStatus = 'loaded';

    if (
      // eslint-disable-next-line no-underscore-dangle
      this._layerStatus === 'loaded' &&
      this.parentLayerConfig &&
      ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('loaded', [this.parentLayerConfig as GroupLayerEntryConfig])
    )
      this.parentLayerConfig.layerStatus = 'loaded';
  }

  /**
   * Getter for the layer Path of the layer configuration parameter.
   * @param {ConfigBaseClass} layerConfig The layer configuration for which we want to get the layer path.
   * @param {string} layerPath Internal parameter used to build the layer path (should not be used by the user).
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
   * Emits an event to all handlers.
   * @param {LayerStatusChangedEvent} event The event to emit
   * @private
   */
  // TODO: refactor - if this emit is private with #, abstract-base-layer-entry-config.ts:28 Uncaught (in promise) TypeError: Private element is not present on this object
  // TO.DOCONT: this by pass the error, I need to set this public. The problem come from the groupLayer object trying to emit this event but
  // TO.DOCONT: the event is not define so this.onLayerStatus.... failed
  #emitLayerStatusChanged(event: LayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   * @param {LayerStatusChangedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   *
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   *
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return ConfigBaseClass.#layerStatusWeight[this.layerStatus] >= ConfigBaseClass.#layerStatusWeight[layerStatus];
  }

  /**
   * Serializes the ConfigBaseClass class
   * @returns {TypeJsonValue} The serialized ConfigBaseClass
   */
  serialize(): TypeJsonValue {
    // Redirect
    return this.onSerialize();
  }

  /**
   * Overridable function to serialize a ConfigBaseClass
   * @returns {TypeJsonValue} The serialized ConfigBaseClass
   */
  onSerialize(): TypeJsonValue {
    return {
      layerIdExtension: this.layerIdExtension,
      schemaTag: this.schemaTag,
      entryType: this.entryType,
      layerStatus: this.layerStatus,
      isMetadataLayerGroup: this.isMetadataLayerGroup,
    } as unknown as TypeJsonValue;
  }

  /**
   * Recursively checks the list of layer entries to see if all of them are greater than or equal to the provided layer status.
   *
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   *                                                            (default: this.listOfLayerEntryConfig).
   *
   * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
   */
  static allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus, listOfLayerEntryConfig: TypeLayerEntryConfig[]): boolean {
    // Try to find a layer that is not greater than or equal to the layerStatus parameter. If you can, return false
    return !listOfLayerEntryConfig.find((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig))
        return !this.allLayerStatusAreGreaterThanOrEqualTo(layerStatus, layerConfig.listOfLayerEntryConfig);
      return !layerConfig.isGreaterThanOrEqualTo(layerStatus || 'newInstance');
    });
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent>;

/**
 * Define an event for the delegate
 */
export type LayerStatusChangedEvent = {
  // The layer path affected.
  layerPath: string;
  // The new layer status to assign to the layer path.
  layerStatus: TypeLayerStatus;
};
