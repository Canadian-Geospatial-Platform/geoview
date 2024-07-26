import BaseLayer from 'ol/layer/Base';
import { Extent, TypeLocalizedString } from '@/api/config/types/map-schema-types';
import { EventDelegateBase } from '@/api/events/event-helper';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
/**
 * Abstract Base Layer managing an OpenLayer layer, including a layer group.
 */
export declare abstract class AbstractBaseLayer {
    #private;
    protected olLayer: BaseLayer;
    /**
     * Constructs a GeoView base layer to manage an OpenLayer layer, including group layers.
     * @param {string} mapId - The map id
     * @param {ConfigBaseClass} layerConfig - The layer configuration.
     */
    protected constructor(mapId: string, layerConfig: ConfigBaseClass);
    /**
     * Must override method to get the layer attributions
     * @returns {string[]} The layer attributions
     */
    abstract getAttributions(): string[];
    /**
     * Gets the Map Id
     * @returns The Map id
     */
    getMapId(): string;
    /**
     * Gets the layer configuration associated with the layer.
     * @returns {ConfigBaseClass} The layer configuration
     */
    getLayerConfig(): ConfigBaseClass;
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
     * @returns {TypeLocalizedString | undefined} The layer name
     */
    getGeoviewLayerName(): TypeLocalizedString | undefined;
    /**
     * Gets the layer status
     * @returns The layer status
     */
    getLayerStatus(layerPath: string): TypeLayerStatus;
    /**
     * Gets the layer name
     * @returns The layer name
     */
    getLayerName(layerPath: string): TypeLocalizedString | undefined;
    /**
     * Sets the layer name
     * @param {TypeLocalizedString | undefined} name - The layer name
     */
    setLayerName(layerPath: string, name: TypeLocalizedString | undefined): void;
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
     * Overridable function that gets the extent of an array of features.
     * @param {string} layerPath - The layer path
     * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
     * @returns {Promise<Extent | undefined>} The extent of the features, if available
     */
    getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined>;
    /**
     * Gets the opacity of the layer (between 0 and 1).
     * @returns {number} The opacity of the layer.
     */
    getOpacity(): number;
    /**
     * Sets the opacity of the layer (between 0 and 1).
     * @param {number} layerOpacity The opacity of the layer.
     */
    setOpacity(layerOpacity: number): void;
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
    layerName?: TypeLocalizedString;
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
    layerPath: string;
    opacity: number;
};
export {};
