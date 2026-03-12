import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { LayerConfigNotFoundError } from '@/core/exceptions/geoview-exceptions';
import { LayerWrongTypeError } from '../exceptions/layer-exceptions';

export class LayerDomain {
  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: { [layerPath: string]: ConfigBaseClass } = {};

  /** Keep a bounded reference to the handle layer status changed */
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  /** Keep all callback delegate references */
  #onLayerStatusChangedHandlers: ConfigLayerStatusChangedDelegate[] = [];

  /**
   * Constructor for the LayerDomain class.
   */
  constructor() {
    // Keep bounded references to the handles
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
  }

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    const uniqueIds = new Set<string>();
    for (const layerPath of this.getLayerEntryLayerPaths()) {
      uniqueIds.add(layerPath.split('/')[0]);
    }
    return Array.from(uniqueIds);
  }

  /**
   * Gets the Layer Entry layer paths
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    return Object.keys(this.#layerEntryConfigs);
  }

  /**
   * Gets the Layer Entry Configs
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    return Object.values(this.#layerEntryConfigs);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    // Get the layer config
    const layerConfig = this.#layerEntryConfigs?.[layerPath];

    // If not found
    if (!layerConfig) throw new LayerConfigNotFoundError(layerPath);

    // Return the layer config
    return layerConfig;
  }

  /**
   * Gets the layer configuration of the specified layer path.
   * @param layerPath - The layer path.
   * @returns The layer configuration or undefined if not found.
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    return this.#layerEntryConfigs?.[layerPath];
  }

  /**
   * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig {
    // Get the layer entry config
    const layerConfig = this.getLayerEntryConfig(layerPath);

    // Check if wrong type
    if (!(layerConfig instanceof GroupLayerEntryConfig)) throw new LayerWrongTypeError(layerPath, layerConfig.getLayerNameCascade());

    // Return the layer config
    return layerConfig;
  }

  registerLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Keep it
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;

    // Register a handler when the config layer status changes (this allows catching the status >= registered, all the way to loaded/error)
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  deleteLayerEntryConfig(layerPath: string): void {
    // Unregister the handler
    this.#layerEntryConfigs[layerPath]?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Delete it
    delete this.#layerEntryConfigs[layerPath];
  }

  // #region PRIVATE HANDLERS

  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, event: LayerStatusChangedEvent): void {
    // Emit about it
    this.#emitLayerStatusChanged({ config: layerConfig, status: event.layerStatus });
  }

  // #endregion PRIVATE HANDLERS

  // #region EVENTS

  /**
   * Emits layer status changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerStatusChanged(event: ConfigLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a layer status changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged(callback: ConfigLayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: ConfigLayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export type ConfigLayerStatusChangedEvent = {
  // The layer entry config changing its layer status
  config: ConfigBaseClass;

  // The new status
  status: TypeLayerStatus;
};

/**
 * Define a delegate for the event handler function signature
 */
export type ConfigLayerStatusChangedDelegate = EventDelegateBase<LayerDomain, ConfigLayerStatusChangedEvent, void>;
