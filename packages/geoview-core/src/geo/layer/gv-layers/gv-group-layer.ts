import LayerGroup from 'ol/layer/Group';
import type { Options as LayerGroupOptions } from 'ol/layer/Group';
import type { Projection as OLProjection } from 'ol/proj';
import type { Extent } from 'ol/extent';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GeoUtilities } from '@/geo/utils/utilities';

/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export class GVGroupLayer extends AbstractBaseGVLayer {
  /** The layers in the group */
  #layers: AbstractBaseGVLayer[] = [];

  /** Keep all callback delegate references */
  #onLayerAddedHandlers: LayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerRemovedHandlers: LayerDelegate[] = [];

  /**
   * Constructs a Group layer to manage an OpenLayer Group Layer.
   * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
   * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(layerGroupOptions: LayerGroupOptions, layerConfig: GroupLayerEntryConfig) {
    super(layerConfig);

    // Create the OpenLayer layer
    this.setOLLayer(new LayerGroup(layerGroupOptions));

    // Register an event for when the group layer turns loaded for the first time only
    layerConfig.onLayerStatusChanged((config) => {
      if (config.layerStatus === 'loaded' && !this.loadedOnce) {
        this.loadedOnce = true;
        this.setVisible(layerConfig.getInitialSettings()?.states?.visible ?? true); // default: true
      }
    });
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {GroupLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
   */
  override getLayerConfig(): GroupLayerEntryConfig {
    return super.getLayerConfig() as GroupLayerEntryConfig;
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {LayerGroup} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): LayerGroup {
    // Call parent and cast
    return super.getOLLayer() as LayerGroup;
  }

  /**
   * Overrides the way the attributions are retrieved.
   * @returns {string[]} The layer attributions.
   * @override
   */
  override onGetAttributions(): string[] {
    // For each layer in the group
    const totalAttributions: string[] = [];
    this.getLayers().forEach((layer) => {
      // Compile the attributions
      totalAttributions.push(...layer.getAttributions());
    });

    // Return the total attributions
    return totalAttributions;
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise of layer bounding box.
   */
  override async onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    // Current bounds
    const boundsArray = [] as Extent[];

    // Redirect
    await this.#gatherAllBoundsRec(boundsArray, this, projection, stops);

    // For each bounds found
    let boundsUnion: Extent | undefined;
    boundsArray.forEach((bounds) => {
      // Union the bounds with each other
      boundsUnion = GeoUtilities.getExtentUnion(boundsUnion, bounds);
    });

    // Return the unioned bounds
    return boundsUnion;
  }

  /**
   * Overrides the refresh function to refresh each layer in the group.
   * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
   * @returns {void}
   * @override
   */
  override onRefresh(projection: OLProjection | undefined): void {
    // Loops on each layer in the group
    this.getLayers().forEach((layer) => {
      // Refresh it
      layer.refresh(projection);
    });
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the immediate layers in the group.
   * @returns {AbstractBaseGVLayer[]} The layers in the group.
   */
  getLayers(): AbstractBaseGVLayer[] {
    return this.#layers;
  }

  /**
   * Returns all leaf layers (non-group layers) contained within this group,
   * including those nested in child groups.
   * @returns An array of `AbstractGVLayer` instances representing all
   * leaf layers in the group hierarchy.
   * @description
   * This is a convenience method that retrieves all descendant layers and
   * filters them to include only concrete `AbstractGVLayer` instances
   * (i.e., excluding `GVGroupLayer` containers).
   * The returned collection is flattened and traversed depth-first.
   */
  getLayersAllLeafs(): AbstractGVLayer[] {
    // Redirect
    return this.getLayersAll((l) => l instanceof AbstractGVLayer) as AbstractGVLayer[];
  }

  /**
   * Returns all layers contained within this group, including nested layers.
   * @param filter - Optional predicate function used to filter the returned layers.
   * If provided, only layers matching the condition will be included in the result.
   * @returns A flattened array of all descendant layers (including group layers),
   * optionally filtered.
   * @description
   * This method performs a depth-first traversal of the group hierarchy,
   * collecting all child layers recursively. If a `filter` function is provided,
   * it is applied to each layer before inclusion in the result.
   * Both `GVGroupLayer` instances and concrete layer types may be returned,
   * depending on the filter criteria.
   */
  getLayersAll(filter?: (layer: AbstractBaseGVLayer) => boolean): AbstractBaseGVLayer[] {
    // To hold the results
    const result: AbstractBaseGVLayer[] = [];

    // Inside function to recurse
    const traverse = (layers: AbstractBaseGVLayer[]): void => {
      for (const layer of layers) {
        if (!filter || filter(layer)) {
          result.push(layer);
        }

        // If the layer is a group, recurse into it
        if (layer instanceof GVGroupLayer) {
          traverse(layer.getLayers());
        }
      }
    };

    // Start
    traverse(this.getLayers());

    // Return the results
    return result;
  }

  /**
   * Adds a layer to the group layer.
   * @param layer - The layer to add.
   */
  addLayer(layer: AbstractBaseGVLayer): void {
    // Officially add it to the OL object
    this.getOLLayer().getLayers().push(layer.getOLLayer());

    // Add the layer to our list
    this.#layers.push(layer);

    // Emit
    this.#emitLayerAdded({ layer });
  }

  /**
   * Removes a layer from the group layer.
   * @param layer - The layer to remove.
   */
  removeLayer(layer: AbstractBaseGVLayer): void {
    // Try to find it
    const idx = this.#layers.findIndex((lyr) => lyr === layer);

    // If not found
    if (idx < 0) throw new LayerNotFoundError(layer.getLayerPath());

    // Officially remove it from the OL object
    this.getOLLayer().getLayers().remove(layer.getOLLayer());

    // Remove it from our list
    this.#layers.splice(idx, 1);

    // Emit
    this.#emitLayerRemoved({ layer });
  }

  /**
   * Recursively gathers all bounds on the layers associated with the given layer path and store them in the bounds parameter.
   * @param bounds - The currently gathered bounds during the recursion
   * @param layer - The layer being processed
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   */
  async #gatherAllBoundsRec(bounds: Extent[], layer: AbstractBaseGVLayer, projection: OLProjection, stops: number): Promise<void> {
    // If a leaf
    if (layer instanceof AbstractGVLayer) {
      // Get the bounds of the layer
      const calculatedBounds = await layer.getBounds(projection, stops);
      if (calculatedBounds) bounds.push(calculatedBounds);
    } else if (layer instanceof GVGroupLayer) {
      // Recursively get all promises of all bounds for all children layers
      const promises = layer.getLayers().map((childLayer) => this.#gatherAllBoundsRec(bounds, childLayer, projection, stops));
      await Promise.all(promises);
    }
  }

  // #endregion METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param event - The event to emit
   * @private
   */
  #emitLayerAdded(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAddedHandlers, event);
  }

  /**
   * Registers a layer added event handler.
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerAdded(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerAddedHandlers, callback);
  }

  /**
   * Unregisters a layer added event handler.
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAdded(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAddedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param event - The event to emit
   * @private
   */
  #emitLayerRemoved(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerRemoved(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerRemoved(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRemovedHandlers, callback);
  }

  // #endregion EVENTS
}

// #region EVENT TYPES

/**
 * Define an event for the delegate
 */
export type LayerEvent = {
  layer: AbstractBaseGVLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<GVGroupLayer, LayerEvent, void>;

// #endregion EVENT TYPES
