/* eslint-disable no-underscore-dangle */
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { AbstractGeoViewLayer, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  CONST_LAYER_ENTRY_TYPES,
  TypeGeoviewLayerConfig,
  TypeLayerEntryType,
  TypeLayerStatus,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { Cast, TypeJsonValue, TypeLocalizedString, api } from '@/core/types/cgpv-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export class ConfigBaseClass {
  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  schemaTag?: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  entryType?: TypeLayerEntryType;

  // TODO: Refactor - There shouldn't be a coupling to a `AbstractGeoViewLayer` inside a Configuration class.
  // TO.DOCONT: That logic should be elsewhere so that the Configuration class remains portable and immutable.
  /** The geoview layer instance that contains this layer configuration. */
  geoviewLayerInstance?: AbstractGeoViewLayer;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig = {} as TypeGeoviewLayerConfig;

  /** It is used internally to distinguish layer groups derived from the
   * metadata. */
  isMetadataLayerGroup?: boolean;

  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig?: string;

  /** The identifier of the layer to display on the map. This element is part of the schema. */
  private _layerId = '';

  /** The layer path to this instance. */
  private _layerPath = '';

  // TODO: Refactor - There shouldn't be a coupling to an OpenLayers `BaseLayer` inside a Configuration class.
  // TO.DOCONT: That logic should be elsewhere so that the Configuration class remains portable and immutable.
  /** This property is used to link the displayed layer to its layer entry config. it is not part of the schema. */
  protected _olLayer: BaseLayer | LayerGroup | null = null;

  /** It is used to identified unprocessed layers and shows the final layer state */
  protected _layerStatus: TypeLayerStatus = 'newInstance';

  layerStatusWeight = {
    newInstance: 10,
    registered: 20,
    processing: 30,
    processed: 40,
    loading: 50,
    loaded: 60,
    error: 70,
  };

  /** Flag indicating that the loaded signal arrived before the processed one */
  protected waitForProcessedBeforeSendingLoaded = false;

  // Keep all callback delegates references
  #onLayerStatusChangedHandlers: LayerStatusChangedDelegate[] = [];

  /**
   * The class constructor.
   * @param {ConfigBaseClass} layerConfig The layer configuration we want to instanciate.
   * @param {string} parentLayerPath The layer path to the parent configuration.
   */
  constructor(layerConfig: ConfigBaseClass, parentLayerPath?: string) {
    Object.assign(this, layerConfig);
    this.parentLayerConfig = parentLayerPath;
    if ('layerIdExtension' in this) {
      const completeLayerId = this.layerIdExtension ? `${this._layerId}.${this.layerIdExtension}` : this._layerId;
      this._layerPath = `${parentLayerPath}/${completeLayerId}`;
    } else {
      this._layerPath = `${parentLayerPath}/${this._layerId}`;
    }
  }

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerPath() {
    return this._layerPath;
  }

  /**
   * The layerPath setter method for the ConfigBaseClass class and its descendant classes.
   */
  protected set layerPath(newLayerPath) {
    this._layerPath = newLayerPath;
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerId() {
    // eslint-disable-next-line no-underscore-dangle
    return this._layerId;
  }

  /**
   * The layerId setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerId The new layerId value.
   */
  set layerId(newLayerId: string) {
    this._layerId = newLayerId;
    if ('layerIdExtension' in this) {
      const completeLayerId = this.layerIdExtension ? `${this._layerId}.${this.layerIdExtension}` : this._layerId;
      this._layerPath = `${this.parentLayerConfig}/${completeLayerId}`;
    } else this._layerPath = `${this.parentLayerConfig}/${this._layerId}`;
  }

  /**
   * The layerStatus getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerStatus() {
    // eslint-disable-next-line no-underscore-dangle
    return this._layerStatus;
  }

  /**
   * The layerStatus setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerStatus The new layerId value.
   */
  set layerStatus(newLayerStatus: TypeLayerStatus) {
    if (
      newLayerStatus === 'loaded' &&
      !layerEntryIsGroupLayer(this) &&
      !this.IsGreaterThanOrEqualTo('loading') &&
      !this.waitForProcessedBeforeSendingLoaded
    ) {
      this.waitForProcessedBeforeSendingLoaded = true;
      return;
    }
    if (!this.IsGreaterThanOrEqualTo(newLayerStatus)) {
      // eslint-disable-next-line no-underscore-dangle
      this._layerStatus = newLayerStatus;
      // TODO: Refactor - Layer status must be moved elsewhere than in a configuration file. Can it be on the layer itself?
      // TO.DOCONT: Also, it'd be "nicer" to have a configuration file that doesn't raise events
      this.emitLayerStatusChanged({ layerPath: this._layerPath, layerStatus: newLayerStatus });
    }
    if (newLayerStatus === 'processed' && this.waitForProcessedBeforeSendingLoaded) this.layerStatus = 'loaded';

    const parentConfig = this.geoviewLayerInstance!.getParentConfig(this.parentLayerConfig!);
    if (
      // eslint-disable-next-line no-underscore-dangle
      this._layerStatus === 'loaded' &&
      parentConfig &&
      this.geoviewLayerInstance!.allLayerStatusAreGreaterThanOrEqualTo('loaded', [parentConfig])
    )
      // TODO: To keep things working, this is how we retreive the parent configuration.
      // TO.DOCONT: We must find a way to do that without using this.geoviewLayerInstance! because
      // TO.DOCONT: layer Config in ConfigApi are not supposed to be linked to a map or a geoviewLayerInstance.
      this.geoviewLayerInstance!.getParentConfig(this._layerPath)!.layerStatus = 'loaded';
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerStatusChangedEvent} event The event to emit
   */
  emitLayerStatusChanged = (event: LayerStatusChangedEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {LayerStatusChangedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged = (callback: LayerStatusChangedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {LayerStatusChangedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged = (callback: LayerStatusChangedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  };

  /**
   * Register the layer identifier. Duplicate identifier are not allowed.
   *
   * @returns {boolean} Returns false if the layer configuration can't be registered.
   */

  // TODO: This method must be removed from the config validation.
  // TO.DOCONT: Suggest to create a method in ConfigApi named getSelectedLayerConfig that will return the same thing registeredLayers
  // TO.DOCONT: A similar method in ConfigApi named getMetadataLayerTree can be coded to return the layerConfig retreived from the metadata
  // TO.DOCONT: Any other suggestions are welcome.

  registerLayerConfig(): boolean {
    const { registeredLayers } = api.maps[this.geoviewLayerInstance!.mapId].layer;
    if (registeredLayers[this._layerPath]) return false;
    (registeredLayers[this._layerPath] as ConfigBaseClass) = this;

    // TODO: Check - Move this registerToLayerSets closer to the others, when I comment the line it seems good, except
    // TO.DOCONT: for an 'Anonymous' group layer that never got 'loaded'. See if we can fix this elsewhere and remove this.
    if (this.entryType !== CONST_LAYER_ENTRY_TYPES.GROUP)
      (this.geoviewLayerInstance as AbstractGeoViewLayer).registerToLayerSets(Cast<AbstractBaseLayerEntryConfig>(this));

    this.layerStatus = 'registered';
    return true;
  }

  // TODO: Check - Is this still used? Remove it and favor the homonymous method in `layer`? (which also should be deleted)
  // TO.DOCONT: I'm commenting it in this big refactor (2024-03-17) to see if anything crashes and if so, where. Seems good to me without it so far.
  // /**
  //  * This method returns the GeoView instance associated to a specific layer path. The first element of the layerPath
  //  * is the geoviewLayerId.
  //  * @param {string} layerPath The layer path to the layer's configuration.
  //  *
  //  * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
  //  */
  //   geoviewLayer(layerPath?: string): AbstractGeoViewLayer {
  //   this.geoviewLayerInstance!.layerPathAssociatedToTheGeoviewLayer = layerPath || this.layerPath;
  //   return this.geoviewLayerInstance!;
  // }

  /**
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   *
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   *
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  IsGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return this.layerStatusWeight[this.layerStatus] >= this.layerStatusWeight[layerStatus];
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
      schemaTag: this.schemaTag,
      entryType: this.entryType,
      layerStatus: this.layerStatus,
      isMetadataLayerGroup: this.isMetadataLayerGroup,
    } as unknown as TypeJsonValue;
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
