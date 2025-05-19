import BaseLayer from 'ol/layer/Base';
import { Projection as OLProjection } from 'ol/proj';

import { Extent, TypeLayerStatus } from '@/api/config/types/map-schema-types';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';

/**
 * Abstract Base Layer managing an OpenLayer layer, including a layer group.
 */
export abstract class AbstractBaseLayer {
  // The layer configuration
  #layerConfig: ConfigBaseClass;

  // The OpenLayer layer // '!' is used here, because the children constructors are supposed to create the olLayer.
  protected olLayer!: BaseLayer;

  // The layer name
  #layerName: string | undefined;

  // Keep all callback delegates references
  #onLayerNameChangedHandlers: LayerNameChangedDelegate[] = [];

  // Keep all callback delegate references
  #onVisibleChangedHandlers: VisibleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerOpacityChangedHandlers: LayerOpacityChangedDelegate[] = [];

  /**
   * Constructs a GeoView base layer to manage an OpenLayer layer, including group layers.
   * @param {ConfigBaseClass} layerConfig - The layer configuration.
   */
  protected constructor(layerConfig: ConfigBaseClass) {
    this.#layerConfig = layerConfig;
    this.#layerName = layerConfig.layerName;
  }

  /**
   * Must override method to get the layer attributions
   * @returns {string[]} The layer attributions
   */
  abstract getAttributions(): string[];

  /**
   * A quick getter to help identify which layer class the current instance is coming from.
   */
  public getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
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
   * @returns {string | undefined} The layer name
   */
  getGeoviewLayerName(): string | undefined {
    return this.#layerConfig.geoviewLayerConfig.geoviewLayerName;
  }

  /**
   * Gets the layer status
   * @returns The layer status
   */
  getLayerStatus(): TypeLayerStatus {
    // Take the layer status from the config
    return this.getLayerConfig()!.layerStatus;
  }

  /**
   * Gets the layer name or fallsback on the layer name in the layer configuration.
   * @returns The layer name
   */
  getLayerName(): string {
    return this.#layerName || this.getLayerConfig().getLayerName();
  }

  /**
   * Sets the layer name
   * @param {string | undefined} name - The layer name
   */
  setLayerName(name: string | undefined): void {
    this.#layerName = name;
    this.#emitLayerNameChanged({ layerName: name });
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
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available
   */
  getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Not implemented
    throw new NotImplementedError(`Feature geometry for ${objectIds}-${outfield} is unavailable from ${this.getLayerPath()}`);
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
   * Checks if layer is visible at the given zoom
   * @param zoom Zoom level to be compared
   * @returns {boolean} If the layer is visible at this zoom level
   */
  inVisibleRange(zoom: number): boolean {
    const minZoom = this.getOLLayer().getMinZoom();
    const maxZoom = this.getOLLayer().getMaxZoom();
    return (!minZoom || zoom > minZoom) && (!maxZoom || zoom <= maxZoom);
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
  layerName?: string;
};

/**
 * Define a delegate for the event handler function signature.
 */
export type LayerNameChangedDelegate = EventDelegateBase<AbstractBaseLayer, LayerNameChangedEvent, void>;

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
