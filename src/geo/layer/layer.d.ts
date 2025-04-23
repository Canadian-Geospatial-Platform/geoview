import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { MapConfigLayerEntry, TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLegendItem } from '@/core/components/layers/types';
export type GeoViewLayerAddedResult = {
    layer: AbstractGeoViewLayer;
    promiseLayer: Promise<void>;
};
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class LayerApi
 */
export declare class LayerApi {
    #private;
    /** used to reference the map viewer */
    mapViewer: MapViewer;
    geometry: GeometryApi;
    initialLayerOrder: Array<TypeOrderedLayerInfo>;
    featureHighlight: FeatureHighlight;
    legendsLayerSet: LegendsLayerSet;
    hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;
    allFeatureInfoLayerSet: AllFeatureInfoLayerSet;
    featureInfoLayerSet: FeatureInfoLayerSet;
    static DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS: boolean;
    /**
     * Initializes layer types and listen to add/remove layer events from outside
     * @param {MapViewer} mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Gets the Map Id.
     * @returns {string} The map id
     */
    getMapId(): string;
    /**
     * Gets the GeoView Layer Ids / UUIDs.
     * @returns The ids of the layers
     */
    getGeoviewLayerIds(): string[];
    /**
     * Gets the GeoView Layer Paths.
     * @returns The layer paths of the GV Layers
     */
    getGeoviewLayerPaths(): string[];
    /**
     * Gets all GeoView Layers
     * @returns The list of new Geoview Layers
     */
    getGeoviewLayers(): AbstractBaseLayer[];
    /**
     * Returns the GeoView instance associated to the layer path.
     * The first element of the layerPath is the geoviewLayerId and this function will
     * work with either the geoViewLayerId or the layerPath.
     * @param {string} layerPath - The layer path
     * @returns The new Geoview Layer
     */
    getGeoviewLayer(layerPath: string): AbstractBaseLayer | undefined;
    /**
     * Verifies if a layer is registered. Returns true if registered.
     * @param {string} layerPath - The layer path to check.
     * @returns {boolean} Returns true if the layer configuration is registered.
     */
    isLayerEntryConfigRegistered(layerPath: string): boolean;
    /**
     * Gets the Layer Entry Config Ids
     * @returns {string[]} The GeoView Layer Ids
     */
    getLayerEntryConfigIds(): string[];
    /**
     * Gets the Layer Entry Configs
     * @returns {string[]} The GeoView Layer Entry Configs
     */
    getLayerEntryConfigs(): ConfigBaseClass[];
    /**
     * Gets the layer configuration of the specified layer path.
     * @param {string} layerPath The layer path.
     * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
     */
    getLayerEntryConfig(layerPath: string): ConfigBaseClass | undefined;
    /**
     * Obsolete function to set the layer configuration in the registered layers.
     */
    setLayerEntryConfigObsolete(layerConfig: ConfigBaseClass): void;
    /**
     * Returns the OpenLayer instance associated with the layer path.
     * @param {string} layerPath - The layer path to the layer's configuration.
     * @returns {BaseLayer} Returns the geoview instance associated to the layer path.
     */
    getOLLayer(layerPath: string): BaseLayer | undefined;
    /**
     * Asynchronously returns the OpenLayer layer associated to a specific layer path.
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
     * @param {string} layerPath - The layer path to the layer's configuration.
     * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
     * @returns {Promise<BaseLayer>} Returns the OpenLayer layer associated to the layer path.
     */
    getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer>;
    /**
     * Generate an array of layer info for the orderedLayerList.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The config to get the info from.
     * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
     */
    static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig): TypeOrderedLayerInfo[];
    /**
     * Load layers that was passed in with the map config
     * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - An optional array containing layers passed within the map config
     * @returns {Promise<void>}
     */
    loadListOfGeoviewLayer(mapConfigLayerEntries?: MapConfigLayerEntry[]): Promise<void>;
    /**
     * Show the errors that happened during layers loading.
     * If it's an aggregate error, log and show all of them.
     * If it's a regular error, log and show only that error.
     * @param error - The error to log and show.
     * @param geoviewLayerId - The Geoview layer id for which the error happened.
     */
    logAndShowLayerError(error: unknown, geoviewLayerId: string): void;
    /**
     * Refreshes GeoCore Layers
     */
    reloadGeocoreLayers(): void;
    /**
     * Adds a Geoview Layer by GeoCore UUID.
     * @param {string} uuid - The GeoCore UUID to add to the map
     * @param {string} layerEntryConfig - The optional layer configuration
     * @returns {Promise<void>} A promise which resolves when done adding
     */
    addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<void>;
    /**
     * Adds a layer to the map. This is the main method to add a GeoView Layer on the map.
     * It handles all the processing, including the validations, and makes sure to inform the layer sets about the layer.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add
     * @returns {GeoViewLayerAddedResult} The result of the addition of the geoview layer.
     * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
     */
    addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult;
    /**
     * Registers the layer identifier.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to register
     */
    registerLayerConfigInit(layerConfig: ConfigBaseClass): void;
    /**
     * Registers the layer in the LayerApi layer-sets to start managing it.
     * This function may be used to start managing a layer in the UI when said layer has been created outside of the regular config->layer flow.
     * @param {AbstractGVLayer} layer - The layer to register
     */
    registerLayerInLayerSets(layer: AbstractGVLayer): void;
    /**
     * Unregisters the layer in the LayerApi to stop managing it.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to unregister
     * @param {boolean} unregisterOrderedLayerInfo - Should it be unregistered from orderedLayerInfo
     */
    unregisterLayerConfig(layerConfig: ConfigBaseClass, unregisterOrderedLayerInfo?: boolean): void;
    /**
     * Checks if the layer results sets are all greater than or equal to the provided status
     */
    checkLayerStatus(status: TypeLayerStatus, layerEntriesToCheck: MapConfigLayerEntry[] | undefined, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number];
    /**
     * Checks if the layer results sets are all ready using the resultSet from the FeatureInfo LayerSet
     */
    checkFeatureInfoLayerResultSetsReady(callbackNotReady?: (layerEntryConfig: AbstractBaseLayerEntryConfig) => void): boolean;
    /**
     * Removes all geoview layers from the map
     */
    removeAllGeoviewLayers(): void;
    /**
     * Removes all layers in error from the map
     */
    removeAllLayersInError(): void;
    /**
     * Removes layer and feature highlights for a given layer.
     * @param {string} layerPath - The path of the layer to remove highlights from.
     */
    removeLayerHighlights(layerPath: string): void;
    /**
     * Removes a layer from the map using its layer path. The path may point to the root geoview layer
     * or a sub layer.
     * @param {string} layerPath - The path or ID of the layer to be removed
     */
    removeLayerUsingPath(layerPath: string): void;
    /**
     * Highlights layer or sublayer on map
     *
     * @param {string} layerPath - ID of layer to highlight
     */
    highlightLayer(layerPath: string): void;
    /**
     * Removes layer or sublayer highlight
     */
    removeHighlightLayer(): void;
    /**
     * Gets the max extent of all layers on the map, or of a provided subset of layers.
     *
     * @param {string[]} layerIds - IDs or layerPaths of layers to get max extents from.
     * @returns {Extent} The overall extent.
     */
    getExtentOfMultipleLayers(layerIds?: string[]): Extent;
    /**
     * Loops through all geoview layers and refresh their respective source.
     * Use this function on projection change or other viewer modification who may affect rendering.
     */
    refreshLayers(): void;
    /**
     * Refresh geoview layer source.
     * @param {BaseLayer} baseLayer - The layer to refresh.
     */
    refreshBaseLayer(baseLayer: BaseLayer): void;
    /**
     * Toggle visibility of an item.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {TypeLegendItem} item - The item to change.
     * @param {boolean} visibility - The visibility to set.
     * @param {boolean} updateLegendLayers - Should legend layers be updated (here to avoid repeated rerendering when setting all items in layer).
     */
    setItemVisibility(layerPath: string, item: TypeLegendItem, visibility: boolean, updateLegendLayers?: boolean): void;
    /**
     * Set visibility of all geoview layers on the map
     *
     * @param {boolean} newValue - The new visibility.
     */
    setAllLayersVisibility(newValue: boolean): void;
    /**
     * Sets or toggles the visibility of a layer.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {boolean} newValue - The new value of visibility.
     */
    setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean;
    /**
     * Renames a layer.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {string} name - The new name to use.
     */
    setLayerName(layerPath: string, name: string): void;
    /**
     * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {GeoJSONObject | string} geojson - The new geoJSON.
     */
    setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): void;
    /**
     * Redefine feature info fields.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {string} fieldNames - The new field names to use, separated by commas.
     * @param {'alias' | 'name'} fields - The fields to change.
     */
    redefineFeatureFields(layerPath: string, fieldNames: string, fields: 'alias' | 'name'): void;
    /**
     * Calculates an union of all the layer extents based on the given layerPath and its possible children.
     * @param {string} layerPath - The layer path
     * @returns {Extent | undefined} An extent representing an union of all layer extents associated with the layer path
     */
    calculateBounds(layerPath: string): Extent | undefined;
    /**
     * Recalculates the bounds for all layers and updates the store.
     */
    recalculateBoundsAll(): void;
    /**
     * Registers a layer added event handler.
     * @param {LayerAddedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerAdded(callback: LayerAddedDelegate): void;
    /**
     * Unregisters a layer added event handler.
     * @param {LayerAddedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAdded(callback: LayerAddedDelegate): void;
    /**
     * Registers a layer loaded event handler.
     * @param {LayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoaded(callback: LayerLoadedDelegate): void;
    /**
     * Unregisters a layer loaded event handler.
     * @param {LayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: LayerLoadedDelegate): void;
    /**
     * Registers a layer error event handler.
     * @param {LayerErrorDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerError(callback: LayerErrorDelegate): void;
    /**
     * Unregisters a layer error event handler.
     * @param {LayerErrorDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: LayerErrorDelegate): void;
    /**
     * Registers a layer removed event handler.
     * @param {LayerRemovedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerRemoved(callback: LayerRemovedDelegate): void;
    /**
     * Unregisters a layer removed event handler.
     * @param {LayerRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerRemoved(callback: LayerRemovedDelegate): void;
    /**
     * Registers a layer visibility toggled event handler.
     * @param {LayerVisibilityToggledDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void;
    /**
     * Unregisters a layer  visibility toggled event handler.
     * @param {LayerVisibilityToggledDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void;
    /**
     * Registers a layer item visibility toggled event handler.
     * @param {LayerItemVisibilityToggledDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void;
    /**
     * Unregisters a layer item visibility toggled event handler.
     * @param {LayerItemVisibilityToggledDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type LayerAddedDelegate = EventDelegateBase<LayerApi, LayerAddedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerAddedEvent = {
    layer: AbstractGeoViewLayer | AbstractGVLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerLoadedDelegate = EventDelegateBase<LayerApi, LayerLoadedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerLoadedEvent = {
    layer: AbstractGVLayer;
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerErrorDelegate = EventDelegateBase<LayerApi, LayerErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
    layerPath: string;
    error: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerRemovedDelegate = EventDelegateBase<LayerApi, LayerRemovedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerRemovedEvent = {
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerVisibilityToggledEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerVisibilityToggledEvent = {
    layerPath: string;
    visibility: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerItemVisibilityToggledEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerItemVisibilityToggledEvent = {
    layerPath: string;
    itemName: string;
    visibility: boolean;
};
export {};
