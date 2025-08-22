import BaseLayer from 'ol/layer/Base';
import { Projection as OLProjection } from 'ol/proj';
import { Extent, TypeLayerStatus } from '@/api/config/types/map-schema-types';
import { EventDelegateBase } from '@/api/events/event-helper';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
/**
 * Abstract Base Layer managing an OpenLayer layer, including a layer group.
 */
export declare abstract class AbstractBaseLayer {
    #private;
    /** Indicates if the layer has become in loaded status at least once already */
    loadedOnce: boolean;
    /**
     * Constructs a GeoView base layer to manage an OpenLayer layer, including group layers.
     * @param {ConfigBaseClass} layerConfig - The layer configuration.
     */
    protected constructor(layerConfig: ConfigBaseClass);
    /**
     * Must override method to get the layer attributions
     * @returns {string[]} The layer attributions
     */
    protected abstract onGetAttributions(): string[];
    /**
     * Must override method to refresh a layer
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     */
    protected abstract onRefresh(projection: OLProjection | undefined): void;
    /**
     * Gets the attributions for the layer by calling the overridable function 'onGetAttributions'.
     * When the layer is a GVLayer, its layer attributions are returned.
     * When the layer is a GVGroup, all layers attributions in the group are returned.
     * @returns {string[]} The layer attributions.
     */
    getAttributions(): string[];
    /**
     * Refreshes the layer by calling the overridable function 'onRefresh'.
     * When the layer is a GVLayer its layer source is refreshed.
     * When the layer is a GVGroup, all layers in the group are refreshed.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     */
    refresh(projection: OLProjection | undefined): void;
    /**
     * A quick getter to help identify which layer class the current instance is coming from.
     */
    getClassName(): string;
    /**
     * Gets the layer configuration associated with the layer.
     * @returns {ConfigBaseClass} The layer configuration
     */
    getLayerConfig(): ConfigBaseClass;
    /**
     * Sets the OpenLayers Layer
     * @param {BaseLayer} layer - The OpenLayers Layer
     */
    protected setOLLayer(layer: BaseLayer): void;
    /**
     * Gets the OpenLayers Layer
     * @returns The OpenLayers Layer
     */
    getOLLayer(): BaseLayer;
    /**
     * Gets the layer path associated with the layer.
     * @returns {string} The layer path
     */
    getLayerPath(): string;
    /**
     * Gets the Geoview layer id.
     * @returns {string} The geoview layer id
     */
    getGeoviewLayerId(): string;
    /**
     * Gets the geoview layer name.
     * @returns {string | undefined} The layer name
     */
    getGeoviewLayerName(): string | undefined;
    /**
     * Gets the layer status
     * @returns The layer status
     */
    getLayerStatus(): TypeLayerStatus;
    /**
     * Gets the layer name or falls back on the layer name in the layer configuration.
     * @returns The layer name
     */
    getLayerName(): string;
    /**
     * Sets the layer name
     * @param {string | undefined} name - The layer name
     */
    setLayerName(name: string | undefined): void;
    /**
     * Returns the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy].
     * The extent is used to clip the data displayed on the map.
     * @returns {Extent | undefined} The layer extent.
     */
    getExtent(): Extent | undefined;
    /**
     * Sets the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy].
     * @param {Extent} layerExtent The extent to assign to the layer.
     */
    setExtent(layerExtent: Extent): void;
    /**
     * Gets the opacity of the layer (between 0 and 1).
     * @returns {number} The opacity of the layer.
     */
    getOpacity(): number;
    /**
     * Sets the opacity of the layer (between 0 and 1).
     * @param {number} layerOpacity The opacity of the layer.
     * @param {boolean} emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
     */
    setOpacity(layerOpacity: number, emitOpacityChange?: boolean): void;
    /**
     * Gets the visibility of the layer (true or false).
     * @returns {boolean} The visibility of the layer.
     */
    getVisible(): boolean;
    /**
     * Sets the visibility of the layer (true or false).
     * @param {boolean} layerVisibility The visibility of the layer.
     */
    setVisible(layerVisibility: boolean): void;
    /**
     * Gets the min zoom of the layer.
     * @returns {number} The min zoom of the layer.
     */
    getMinZoom(): number;
    /**
     * Sets the min zoom of the layer.
     * @param {number} minZoom The min zoom of the layer.
     */
    setMinZoom(minZoom: number): void;
    /**
     * Gets the max zoom of the layer.
     * @returns {number} The max zoom of the layer.
     */
    getMaxZoom(): number;
    /**
     * Sets the max zoom of the layer.
     * @param {number} maxZoom The max zoom of the layer.
     */
    setMaxZoom(maxZoom: number): void;
    /**
     * Checks if layer is visible at the given zoom
     * @param zoom Zoom level to be compared
     * @returns {boolean} If the layer is visible at this zoom level
     */
    inVisibleRange(zoom: number): boolean;
    /**
     * Registers a layer name changed event handler.
     * @param {LayerNameChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerNameChanged(callback: LayerNameChangedDelegate): void;
    /**
     * Unregisters a layer name changed event handler.
     * @param {LayerNameChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerNameChanged(callback: LayerNameChangedDelegate): void;
    /**
     * Registers a visible changed event handler.
     * @param {VisibleChangedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onVisibleChanged(callback: VisibleChangedDelegate): void;
    /**
     * Unregisters a visible changed event handler.
     * @param {VisibleChangedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offVisibleChanged(callback: VisibleChangedDelegate): void;
    /**
     * Registers an opacity changed event handler.
     * @param {LayerOpacityChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void;
    /**
     * Unregisters an opacity changed event handler.
     * @param {LayerOpacityChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void;
}
/**
 * Define an event for the delegate.
 */
export type LayerNameChangedEvent = {
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
export type VisibleChangedDelegate = EventDelegateBase<AbstractBaseLayer, VisibleChangedEvent, void>;
/**
 * Define a delegate for the event handler function signature
 */
export type LayerOpacityChangedDelegate = EventDelegateBase<AbstractBaseLayer, LayerOpacityChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerOpacityChangedEvent = {
    layerPath: string;
    opacity: number;
};
//# sourceMappingURL=abstract-base-layer.d.ts.map