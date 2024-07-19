import BaseLayer from 'ol/layer/Base';

import { Extent, TypeLocalizedString } from '@/api/config/types/map-schema-types';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * Abstract Base Layer managing an OpenLayer layer, including a layer group.
 */
export abstract class AbstractBaseLayer {
  // The map id
  #mapId: string;

  // The layer configuration
  #layerConfig: ConfigBaseClass;

  // The OpenLayer layer // '!' is used here, because the children constructors are supposed to create the olLayer.
  protected olLayer!: BaseLayer;

  // The layer name
  #layerName: TypeLocalizedString | undefined;

  // Keep all callback delegates references
  #onLayerNameChangedHandlers: LayerNameChangedDelegate[] = [];

  // Keep all callback delegate references
  #onVisibleChangedHandlers: VisibleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerOpacityChangedHandlers: LayerOpacityChangedDelegate[] = [];

  /**
   * Constructs a GeoView base layer to manage an OpenLayer layer, including group layers.
   * @param {string} mapId - The map id
   * @param {ConfigBaseClass} layerConfig - The layer configuration.
   */
  protected constructor(mapId: string, layerConfig: ConfigBaseClass) {
    this.#mapId = mapId;
    this.#layerConfig = layerConfig;
    this.#layerName = layerConfig.layerName;
  }

  /**
   * Must override method to get the layer attributions
   * @returns {string[]} The layer attributions
   */
  abstract getAttributions(): string[];

  /**
   * Gets the Map Id
   * @returns The Map id
   */
  getMapId(): string {
    return this.#mapId;
  }

  /**
   * Gets the layer configuration associated with the layer.
   * @returns {ConfigBaseClass} The layer configuration
   */
  getLayerConfig(): ConfigBaseClass {
    return this.#layerConfig;
  }

  /**
   * Gets the OpenLayers Layer
   * @returns The OpenLayers Layer
   */
  getOLLayer(): BaseLayer {
    return this.olLayer;
  }

  /**
   * Gets the layer path associated with the layer.
   * @returns {string} The layer path
   */
  getLayerPath(): string {
    return this.#layerConfig.layerPath;
  }

  /**
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerId(): string {
    return this.#layerConfig.geoviewLayerConfig.geoviewLayerId;
  }

  /**
   * Gets the geoview layer name.
   * @returns {TypeLocalizedString | undefined} The layer name
   */
  getGeoviewLayerName(): TypeLocalizedString | undefined {
    return this.#layerConfig.geoviewLayerConfig.geoviewLayerName;
  }

  /**
   * Gets the layer configuration status
   * @returns The layer status
   */
  getLayerConfigStatus(): TypeLayerStatus {
    return this.#layerConfig.layerStatus;
  }

  /**
   * Gets the layer name
   * @returns The layer name
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLayerName(layerPath: string): TypeLocalizedString | undefined {
    // TODO: Refactor - After layers refactoring, remove the layerPath parameter here (gotta keep it in the signature for now for the layers-set active switch)
    return this.#layerName;
  }

  /**
   * Sets the layer name
   * @param {TypeLocalizedString | undefined} name - The layer name
   */
  setLayerName(layerPath: string, name: TypeLocalizedString | undefined): void {
    // TODO: Refactor - After layers refactoring, remove the layerPath parameter here (gotta keep it in the signature for now for the layers-set active switch)
    this.#layerName = name;
    this.#emitLayerNameChanged({ layerPath, layerName: name });
  }

  /**
   * Returns the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy].
   * The extent is used to clip the data displayed on the map.
   * @returns {Extent | undefined} The layer extent.
   */
  getExtent(): Extent | undefined {
    return this.getOLLayer().getExtent();
  }

  /**
   * Sets the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy].
   * @param {Extent} layerExtent The extent to assign to the layer.
   */
  setExtent(layerExtent: Extent): void {
    this.getOLLayer().setExtent(layerExtent);
  }

  /**
   * Overridable function that gets the extent of an array of features.
   * @param {string} layerPath - The layer path
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined> {
    logger.logError(`Feature geometry for ${objectIds} is unavailable from ${layerPath}`);
    return Promise.resolve(undefined);
  }

  /**
   * Gets the opacity of the layer (between 0 and 1).
   * @returns {number} The opacity of the layer.
   */
  getOpacity(): number {
    return this.getOLLayer().getOpacity();
  }

  /**
   * Sets the opacity of the layer (between 0 and 1).
   * @param {number} layerOpacity The opacity of the layer.
   */
  setOpacity(layerOpacity: number): void {
    this.getOLLayer().setOpacity(layerOpacity);
    this.#emitLayerOpacityChanged({ layerPath: this.getLayerPath(), opacity: layerOpacity });
  }

  /**
   * Gets the visibility of the layer (true or false).
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(): boolean {
    return this.getOLLayer().getVisible();
  }

  /**
   * Sets the visibility of the layer (true or false).
   * @param {boolean} layerVisibility The visibility of the layer.
   */
  setVisible(layerVisibility: boolean): void {
    const curVisible = this.getVisible();
    this.getOLLayer().setVisible(layerVisibility);
    if (layerVisibility !== curVisible) this.#emitVisibleChanged({ visible: layerVisibility });
  }

  /**
   * Gets the min zoom of the layer.
   * @returns {number} The min zoom of the layer.
   */
  getMinZoom(): number {
    return this.getOLLayer().getMinZoom();
  }

  /**
   * Sets the min zoom of the layer.
   * @param {number} minZoom The min zoom of the layer.
   */
  setMinZoom(minZoom: number): void {
    this.getOLLayer().setMinZoom(minZoom);
  }

  /**
   * Gets the max zoom of the layer.
   * @returns {number} The max zoom of the layer.
   */
  getMaxZoom(): number {
    return this.getOLLayer().getMaxZoom();
  }

  /**
   * Sets the max zoom of the layer.
   * @param {number} maxZoom The max zoom of the layer.
   */
  setMaxZoom(maxZoom: number): void {
    this.getOLLayer().setMaxZoom(maxZoom);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerNameChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerNameChanged(event: LayerNameChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerNameChangedHandlers, event);
  }

  /**
   * Registers a layer name changed event handler.
   * @param {LayerNameChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerNameChanged(callback: LayerNameChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Unregisters a layer name changed event handler.
   * @param {LayerNameChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerNameChanged(callback: LayerNameChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {VisibleChangedEvent} event The event to emit
   * @private
   */
  #emitVisibleChanged(event: VisibleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onVisibleChangedHandlers, event);
  }

  /**
   * Registers a visible changed event handler.
   * @param {VisibleChangedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onVisibleChanged(callback: VisibleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onVisibleChangedHandlers, callback);
  }

  /**
   * Unregisters a visible changed event handler.
   * @param {VisibleChangedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offVisibleChanged(callback: VisibleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onVisibleChangedHandlers, callback);
  }

  /**
   * Emits opacity changed event.
   * @param {LayerOpacityChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerOpacityChanged(event: LayerOpacityChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerOpacityChangedHandlers, event);
  }

  /**
   * Registers an opacity changed event handler.
   * @param {LayerOpacityChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerOpacityChangedHandlers, callback);
  }

  /**
   * Unregisters an opacity changed event handler.
   * @param {LayerOpacityChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerOpacityChangedHandlers, callback);
  }
}

/**
 * Define an event for the delegate.
 */
export type LayerNameChangedEvent = {
  // The new layer name.
  layerName?: TypeLocalizedString;
  // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
  // The layer path.
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature.
 */
type LayerNameChangedDelegate = EventDelegateBase<AbstractBaseLayer, LayerNameChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type VisibleChangedEvent = {
  visible: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
type VisibleChangedDelegate = EventDelegateBase<AbstractBaseLayer, VisibleChangedEvent, void>;

/**
 * Define a delegate for the event handler function signature
 */
type LayerOpacityChangedDelegate = EventDelegateBase<AbstractBaseLayer, LayerOpacityChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerOpacityChangedEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // The filter
  opacity: number;
};
