import type BaseLayer from 'ol/layer/Base';
import type { Projection as OLProjection } from 'ol/proj';
import type { Extent } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
/**
 * Abstract Base GV Layer managing an OpenLayer layer, including a layer group.
 */
export declare abstract class AbstractBaseGVLayer {
    #private;
    /** Indicates if the layer has become in loaded status at least once already */
    loadedOnce: boolean;
    /**
     * Constructs a GeoView base layer to manage an OpenLayer layer, including group layers.
     *
     * @param layerConfig - The layer configuration
     */
    protected constructor(layerConfig: ConfigBaseClass);
    /**
     * Must override method to get the layer attributions
     *
     * @returns The layer attributions
     */
    protected abstract onGetAttributions(): string[];
    /**
     * Must override method to get the layer bounds.
     *
     * @param projection - The projection to get the bounds into
     * @param stops - The number of stops to use to generate the extent
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    protected abstract onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Must override method to refresh a layer.
     *
     * @param projection - Optional projection to refresh to
     */
    protected abstract onRefresh(projection: OLProjection | undefined): void;
    /**
     * Overridable method to set the opacity of the layer.
     *
     * If the layer has a parent, the provided opacity is clamped so that it cannot be greater than
     * the parent's opacity. The resulting opacity is applied to the underlying OpenLayers layer.
     *
     * If the layer is a {@link GVGroupLayer}, the computed opacity is recursively applied to all
     * child layers to maintain consistency within the layer hierarchy.
     *
     * Optionally emits a layer opacity change event.
     *
     * @param opacity - The desired opacity for the layer, typically between `0` (fully transparent)
     * and `1` (fully opaque).
     * @param emitOpacityChanged - Optional, whether to emit a layer opacity changed event after
     * updating the opacity. Defaults to true.
     */
    protected onSetOpacity(opacity: number, emitOpacityChanged?: boolean): void;
    /**
     * Overridable method to set the visibility of the layer.
     *
     * @param visible - The desired visibility for the layer.
     */
    protected onSetVisible(visible: boolean): void;
    /**
     * Overridable method to set the z-index of the layer.
     *
     * @param zIndex - The desired z-index for the layer.
     * @param emitZIndexChanged - Optional, whether to emit a z-index changed event after updating the z-index. Defaults to true.
     */
    protected onSetZIndex(zIndex: number, emitZIndexChanged?: boolean): void;
    /**
     * Gets the attributions for the layer by calling the overridable function 'onGetAttributions'.
     * When the layer is a GVLayer, its layer attributions are returned.
     * When the layer is a GVGroup, all layers attributions in the group are returned.
     *
     * @returns The layer attributions.
     */
    getAttributions(): string[];
    /**
     * Gets the bounds for the layer in the given projection.
     * When the layer is a GVLayer, its layer bounds are returned.
     * When the layer is a GVGroup, an Extent union of all layers bounds in the group is returned.
     *
     * @param projection - The projection to get the bounds into
     * @param stops - The number of stops to use to generate the extent
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    getBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Refreshes the layer by calling the overridable function 'onRefresh'.
     *
     * When the layer is a GVLayer its layer source is refreshed.
     * When the layer is a GVGroup, all layers in the group are refreshed.
     *
     * @param projection - Optional projection to refresh to
     */
    refresh(projection: OLProjection | undefined): void;
    /**
     * A quick getter to help identify which layer class the current instance is coming from.
     *
     * @returns The name of the class
     */
    getClassName(): string;
    /**
     * Gets the layer configuration associated with the layer.
     *
     * @returns The layer configuration
     */
    getLayerConfig(): ConfigBaseClass;
    /**
     * Sets the OpenLayers Layer
     *
     * @param layer - The OpenLayers Layer
     */
    protected setOLLayer(layer: BaseLayer): void;
    /**
     * Gets the OpenLayers Layer
     *
     * @returns The OpenLayers Layer
     */
    getOLLayer(): BaseLayer;
    /**
     * Gets the layer path associated with the layer.
     *
     * @returns The layer path
     */
    getLayerPath(): string;
    /**
     * Gets the Geoview layer id.
     *
     * @returns The geoview layer id
     */
    getGeoviewLayerId(): string;
    /**
     * Gets the geoview layer name.
     *
     * @returns The layer name
     */
    getGeoviewLayerName(): string | undefined;
    /**
     * Gets the layer status
     *
     * @returns The layer status
     */
    getLayerStatus(): TypeLayerStatus;
    /**
     * Gets the layer name or falls back on the layer name in the layer configuration.
     *
     * @returns The layer name
     */
    getLayerName(): string;
    /**
     * Sets the layer name
     *
     * @param name - The layer name
     */
    setLayerName(name: string | undefined): void;
    /**
     * Returns the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy].
     * The extent is used to clip the data displayed on the map.
     *
     * @returns The layer extent.
     */
    getExtent(): Extent | undefined;
    /**
     * Sets the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy].
     *
     * @param layerExtent - The extent to assign to the layer.
     */
    setExtent(layerExtent: Extent): void;
    /**
     * Returns the direct parent `GVGroupLayer` of this layer, if any.
     *
     * This method searches through the provided root group layer collection to
     * determine which group directly contains this layer. If the layer is nested
     * within multiple groups, only the immediate parent group is returned.
     *
     * @returns The direct parent group layer, or `undefined` if this layer is not
     *   contained within any group.
     */
    getParent(): GVGroupLayer | undefined;
    /**
     * Sets the parent layer
     *
     * @param parent - The parent layer for the current layer if any.
     */
    setParent(parent: GVGroupLayer | undefined): void;
    /**
     * Retrieves all parent group layers of this layer in hierarchical order.
     *
     * The returned array starts with the immediate parent and continues up
     * the hierarchy until the root group layer is reached or a group has already been visited
     * (not supposed to happen).
     *
     * This method traverses upward through the parent chain starting
     * from the immediate parent of this layer. A protection mechanism prevents infinite
     * loops in case of circular parent references.
     *
     * @returns An array of parent {@link GVGroupLayer} instances, ordered from
     * the immediate parent to the top-most ancestor. Returns an empty array
     * if the layer has no parent.
     */
    getParents(): GVGroupLayer[];
    /**
     * Returns the top-most (root) `GVGroupLayer` ancestor of this layer, if any.
     *
     * @returns The highest ancestor group layer in the hierarchy, or `undefined`
     *   if this layer does not belong to any group.
     */
    getParentRoot(): GVGroupLayer | undefined;
    /**
     * Gets the opacity of the layer (between 0 and 1).
     *
     * @returns The opacity of the layer.
     */
    getOpacity(): number;
    /**
     * Sets the opacity of the layer while ensuring it does not exceed the opacity of its parent layer.
     *
     * If the layer has a parent, the provided opacity is clamped so that it cannot be greater than
     * the parent's opacity. The resulting opacity is applied to the underlying OpenLayers layer.
     *
     * If the layer is a {@link GVGroupLayer}, the computed opacity is recursively applied to all
     * child layers to maintain consistency within the layer hierarchy.
     *
     * Optionally emits a layer opacity change event.
     *
     * @param opacity - The desired opacity for the layer, typically between `0` (fully transparent)
     * and `1` (fully opaque).
     * @param emitOpacityChanged - Optional, whether to emit a layer opacity change event after
     * updating the opacity. Defaults to true.
     */
    setOpacity(opacity: number, emitOpacityChanged?: boolean): void;
    /**
     * Gets the visibility of the layer (true or false).
     *
     * @returns The visibility of the layer.
     */
    getVisible(): boolean;
    /**
     * Determines whether this layer is visible, taking into account the visibility
     * of all its parent groups. A layer is considered visible only if:
     *   - the layer itself is visible, and
     *   - every parent GVGroupLayer up the hierarchy is also visible.
     * This function walks upward through the group layer tree until it reaches
     * the root, returning `false` immediately if any parent is not visible.
     *
     * @returns `true` if this layer and all its parent groups are visible;
     *   otherwise `false`.
     */
    getVisibleIncludingParents(): boolean;
    /**
     * Sets the visibility of the layer (true or false).
     *
     * @param layerVisibility - The visibility of the layer.
     */
    setVisible(layerVisibility: boolean): void;
    /**
     * Sets the z-index of the layer.
     *
     * @param zIndex - The z-index of the layer.
     * @param emitZIndexChanged - Optional, whether to emit a z-index changed event after updating the z-index. Defaults to true.
     */
    setZIndex(zIndex: number, emitZIndexChanged?: boolean): void;
    /**
     * Gets the min zoom of the layer.
     *
     * @returns The min zoom of the layer.
     */
    getMinZoom(): number;
    /**
     * Sets the min zoom of the layer.
     *
     * @param minZoom - The min zoom of the layer.
     */
    setMinZoom(minZoom: number): void;
    /**
     * Gets the max zoom of the layer.
     *
     * @returns The max zoom of the layer.
     */
    getMaxZoom(): number;
    /**
     * Sets the max zoom of the layer.
     *
     * @param maxZoom - The max zoom of the layer.
     */
    setMaxZoom(maxZoom: number): void;
    /**
     * Checks if layer is visible at the given zoo
     *
     * @param zoom - Zoom level to be compared
     * @returns If the layer is visible at this zoom level
     */
    inVisibleRange(zoom: number): boolean;
    /**
     * Registers a layer name changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onLayerNameChanged(callback: LayerNameChangedDelegate): LayerNameChangedDelegate;
    /**
     * Unregisters a layer name changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerNameChanged(callback: LayerNameChangedDelegate | undefined): void;
    /**
     * Registers a visible changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onLayerVisibleChanged(callback: LayerVisibleChangedDelegate): LayerVisibleChangedDelegate;
    /**
     * Unregisters a visible changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerVisibleChanged(callback: LayerVisibleChangedDelegate | undefined): void;
    /**
     * Registers an opacity changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onLayerOpacityChanged(callback: LayerOpacityChangedDelegate): LayerOpacityChangedDelegate;
    /**
     * Unregisters an opacity changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerOpacityChanged(callback: LayerOpacityChangedDelegate | undefined): void;
    /**
     * Registers a z-index changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onLayerZIndexChanged(callback: LayerZIndexChangedDelegate): LayerZIndexChangedDelegate;
    /**
     * Unregisters a z-index changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerZIndexChanged(callback: LayerZIndexChangedDelegate | undefined): void;
    /**
     * Recursively searches the layer tree to find the parent GVGroupLayer
     * of a given layer.
     *
     * The search begins from the provided list of layers,
     * which should represent the root-level layer collection.
     * This method walks top-down through all nested GVGroupLayers until it
     * finds the group whose children contain the specified layer.
     * It proceeds this way, because OpenLayers doesn't have a way to start from a leaf - have to start from the root.
     * @param layer - The layer for which the parent
     *   group is being searched.
     * @param groupLayers - The list of layers to
     *   search within. Typically this is the root layer group of the map.
     * @returns The parent group layer if found,
     *   otherwise `undefined` if the layer has no parent.
     */
    static getParent(layer: AbstractBaseGVLayer, groupLayers: AbstractBaseGVLayer[]): GVGroupLayer | undefined;
}
/**
 * Define an event for the delegate
 */
export interface LayerBaseEvent {
}
/**
 * Define a delegate for the event handler function signature
 */
export type LayerBaseDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerBaseEvent, void>;
/**
 * Define an event for the delegate.
 */
export interface LayerNameChangedEvent extends LayerBaseEvent {
    layerName?: string;
}
/**
 * Define a delegate for the event handler function signature.
 */
export type LayerNameChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerNameChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface LayerVisibleChangedEvent extends LayerBaseEvent {
    visible: boolean;
}
/**
 * Define a delegate for the event handler function signature
 */
export type LayerVisibleChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerVisibleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface LayerOpacityChangedEvent extends LayerBaseEvent {
    opacity: number;
}
/**
 * Define a delegate for the event handler function signature
 */
export type LayerOpacityChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerOpacityChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface LayerZIndexChangedEvent extends LayerBaseEvent {
    zIndex: number;
}
/**
 * Define a delegate for the event handler function signature
 */
export type LayerZIndexChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerZIndexChangedEvent, void>;
//# sourceMappingURL=abstract-base-layer.d.ts.map