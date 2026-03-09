import LayerGroup from 'ol/layer/Group';
import type { Options as LayerGroupOptions } from 'ol/layer/Group';
import type { Projection as OLProjection } from 'ol/proj';
import type { Extent } from 'ol/extent';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export declare class GVGroupLayer extends AbstractBaseGVLayer {
    #private;
    /**
     * Constructs a Group layer to manage an OpenLayer Group Layer.
     * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
     * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(layerGroupOptions: LayerGroupOptions, layerConfig: GroupLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {GroupLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
     */
    getLayerConfig(): GroupLayerEntryConfig;
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {LayerGroup} The strongly-typed OpenLayers type.
     */
    getOLLayer(): LayerGroup;
    /**
     * Overrides the way the attributions are retrieved.
     * @returns {string[]} The layer attributions.
     * @override
     */
    onGetAttributions(): string[];
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise of layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Overrides the refresh function to refresh each layer in the group.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @returns {void}
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Gets the immediate layers in the group.
     * @returns {AbstractBaseGVLayer[]} The layers in the group.
     */
    getLayers(): AbstractBaseGVLayer[];
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
    getLayersAllLeafs(): AbstractGVLayer[];
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
    getLayersAll(filter?: (layer: AbstractBaseGVLayer) => boolean): AbstractBaseGVLayer[];
    /**
     * Adds a layer to the group layer.
     * @param layer - The layer to add.
     */
    addLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Removes a layer from the group layer.
     * @param layer - The layer to remove.
     */
    removeLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Registers a layer added event handler.
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerAdded(callback: LayerDelegate): void;
    /**
     * Unregisters a layer added event handler.
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAdded(callback: LayerDelegate): void;
    /**
     * Registers a layer removed event handler.
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerRemoved(callback: LayerDelegate): void;
    /**
     * Unregisters a layer removed event handler.
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerRemoved(callback: LayerDelegate): void;
}
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
//# sourceMappingURL=gv-group-layer.d.ts.map