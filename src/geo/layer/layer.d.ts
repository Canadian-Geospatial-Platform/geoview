import type BaseLayer from 'ol/layer/Base';
import type { Extent } from 'ol/extent';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { TypeDisplayLanguage, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { MapConfigLayerEntry, TypeGeoviewLayerConfig, TypeLayerStatus } from '@/api/types/layer-schema-types';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import type { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import type { TypeLegendItem } from '@/core/components/layers/types';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 * @exports
 * @class LayerApi
 */
export declare class LayerApi {
    #private;
    /** Temporary debugging flag indicating if we want the WMS group layers to have their sub layers fully blown up */
    static readonly DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS = false;
    /** Reference on the map viewer */
    mapViewer: MapViewer;
    /** Used to access geometry API to create and manage geometries */
    geometry: GeometryApi;
    /** Order to load layers */
    initialLayerOrder: Array<TypeOrderedLayerInfo>;
    /** Used to access feature and bounding box highlighting */
    featureHighlight: FeatureHighlight;
    /** Legends layer set associated to the map */
    legendsLayerSet: LegendsLayerSet;
    /** Hover feature info layer set associated to the map */
    hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;
    /** All feature info layer set associated to the map */
    allFeatureInfoLayerSet: AllFeatureInfoLayerSet;
    /** Feature info layer set associated to the map */
    featureInfoLayerSet: FeatureInfoLayerSet;
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
     * Load layers that was passed in with the map config
     * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - An optional array containing layers passed within the map config
     * @returns {Promise<void>}
     */
    loadListOfGeoviewLayer(mapConfigLayerEntries: MapConfigLayerEntry[]): Promise<void>;
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
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {GeoViewLayerAddedResult} The result of the addition of the geoview layer.
     * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
     */
    addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult;
    /**
     * Refreshes GeoCore Layers
     */
    reloadGeocoreLayers(): void;
    /**
     * Attempt to reload a layer.
     * @param {string} layerPath - The path to the layer to reload
     */
    reloadLayer(layerPath: string): void;
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
    checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number];
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
     * Sets opacity for a layer.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {number} opacity - The new opacity to use.
     * @param {boolean} emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
     */
    setLayerOpacity(layerPath: string, opacity: number, emitOpacityChange?: boolean): void;
    /**
     * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
     *
     * @param {string} layerPath - The path of the layer.
     * @param {GeoJSONObject | string} geojson - The new geoJSON.
     */
    setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): void;
    /**
     * Redefine feature info fields.
     * @param {string} layerPath - The path of the layer.
     * @param {string[]} fieldNames - The new field names to use.
     * @param {'alias' | 'name'} fields - The fields to change.
     */
    redefineFeatureFields(layerPath: string, fieldNames: string[], fields: 'alias' | 'name'): void;
    /**
     * Replace outfield names, aliases and types with any number of new values, provided an identical count of each are supplied.
     * @param {string} layerPath - The path of the layer.
     * @param {string[]} types - The new field types (TypeOutfieldsType) to use.
     * @param {string[]} fieldNames - The new field names to use.
     * @param {string[]} fieldAliases - The new field aliases to use.
     */
    replaceFeatureOutfields(layerPath: string, types: TypeOutfieldsType[], fieldNames: string[], fieldAliases?: string[]): void;
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
     * Show the errors that happened during layers loading.
     * If it's an aggregate error, log and show all of them.
     * If it's a regular error, log and show only that error.
     * @param error - The error to log and show.
     * @param geoviewLayerId - The Geoview layer id for which the error happened.
     */
    showLayerError(error: unknown, geoviewLayerId: string): void;
    /**
     * Registers a layer config error event handler.
     * @param {LayerConfigErrorDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigError(callback: LayerConfigErrorDelegate): void;
    /**
     * Unregisters a layer config error event handler.
     * @param {LayerConfigErrorDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigError(callback: LayerConfigErrorDelegate): void;
    /**
     * Registers a layer config added event handler.
     * @param {LayerBuilderDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigAdded(callback: LayerBuilderDelegate): void;
    /**
     * Unregisters a layer config added event handler.
     * @param {LayerBuilderDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigAdded(callback: LayerBuilderDelegate): void;
    /**
     * Registers a layer removed event handler.
     * @param {LayerPathDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigRemoved(callback: LayerPathDelegate): void;
    /**
     * Unregisters a layer removed event handler.
     * @param {LayerPathDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigRemoved(callback: LayerPathDelegate): void;
    /**
     * Registers a layer created event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerCreated(callback: LayerDelegate): void;
    /**
     * Unregisters a layer created event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerCreated(callback: LayerDelegate): void;
    /**
     * Registers a callback to be executed whenever the layer status is updated.
     * @param {LayerStatusChangedDelegate} callback - The callback function
     */
    onLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Unregisters a callback from being called whenever the layer status is updated.
     * @param {LayerStatusChangedDelegate} callback - The callback function to unregister
     */
    offLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Registers a layer all loaded/error event handler.
     * @param {LayerConfigDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerAllLoaded(callback: LayerConfigDelegate): void;
    /**
     * Unregisters a layer all loaded/error event handler.
     * @param {LayerConfigDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAllLoaded(callback: LayerConfigDelegate): void;
    /**
     * Registers a layer first loaded event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters a layer first loaded event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Registers a layer loading event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoading(callback: LayerDelegate): void;
    /**
     * Unregisters a layer loading event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: LayerDelegate): void;
    /**
     * Registers a layer loaded event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters a layer loaded event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: LayerDelegate): void;
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
    /**
     * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
     * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, RCS, or standard GeoView),
     * this function processes each entry accordingly and wraps the result in a `Promise`.
     * Errors encountered during asynchronous operations are handled via a provided callback.
     * @param {string} mapId - The unique identifier of the map instance this configuration applies to.
     * @param {TypeDisplayLanguage} language - The language setting used for layer labels and metadata.
     * @param {MapConfigLayerEntry} entry - The array of layer entry to convert.
     * @param {(mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void} errorCallback - Callback invoked when an error occurs during layer processing.
     * @returns {Promise<TypeGeoviewLayerConfig>} The promise resolving to a `TypeGeoviewLayerConfig` object.
     */
    static convertMapConfigToGeoviewLayerConfig(mapId: string, language: TypeDisplayLanguage, entry: MapConfigLayerEntry, errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>;
    /**
     * Converts a list of map configuration layer entries into an array of promises,
     * each resolving to one or more GeoView layer configuration objects.
     * @param {string} mapId - The unique identifier of the map instance this configuration applies to.
     * @param {TypeDisplayLanguage} language - The language setting used for layer labels and metadata.
     * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - The array of layer entries to convert.
     * @param {(mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void} errorCallback - Callback invoked when an error occurs during layer processing.
     * @returns {Promise<TypeGeoviewLayerConfig[]>[]} An array of promises, each resolving to an array of `TypeGeoviewLayerConfig` objects.
     */
    static convertMapConfigsToGeoviewLayerConfig(mapId: string, language: TypeDisplayLanguage, mapConfigLayerEntries: MapConfigLayerEntry[], errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>[];
    /**
     * Generate an array of layer info for the orderedLayerList.
     * @param {TypeGeoviewLayerConfig | ConfigBaseClass} geoviewLayerConfig - The config to get the info from.
     * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
     */
    static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): TypeOrderedLayerInfo[];
    /**
     * Creates an instance of a specific `AbstractGeoViewLayer` subclass based on the given GeoView layer configuration.
     * This function determines the correct layer type from the configuration and instantiates it accordingly.
     * @remarks
     * - This method currently supports GeoJSON, CSV, WMS, Esri Dynamic, Esri Feature, Esri Image,
     *   ImageStatic, WFS, OGC Feature, XYZ Tiles, and Vector Tiles.
     * - If the layer type is not supported, an error is thrown.
     * - TODO: Refactor to use the validated configuration with metadata already fetched.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The configuration object for the GeoView layer.
     * @returns {AbstractGeoViewLayer} An instance of the corresponding `AbstractGeoViewLayer` subclass.
     * @throws {NotSupportedError} If the configuration does not match any supported layer type.
     */
    createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer;
}
export type GeoViewLayerAddedResult = {
    layer: AbstractGeoViewLayer;
    promiseLayer: Promise<void>;
};
/**
 * Define an event for the delegate
 */
export type LayerBuilderEvent = {
    layer: AbstractGeoViewLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerBuilderDelegate = EventDelegateBase<LayerApi, LayerBuilderEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerConfigErrorEvent = {
    layerPath: string;
    error: string;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigErrorDelegate = EventDelegateBase<LayerApi, LayerConfigErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerEvent = {
    layer: AbstractGVLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<LayerApi, LayerEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
    layer: AbstractGVLayer;
    error: unknown;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerErrorDelegate = EventDelegateBase<LayerApi, LayerErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerPathEvent = {
    layerPath: string;
    layerName: string;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerPathDelegate = EventDelegateBase<LayerApi, LayerPathEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerConfigEvent = {
    config: ConfigBaseClass;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigDelegate = EventDelegateBase<LayerApi, LayerConfigEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerStatusChangedEvent = {
    config: ConfigBaseClass;
    status: TypeLayerStatus;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerStatusChangedDelegate = EventDelegateBase<LayerApi, LayerStatusChangedEvent, void>;
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
export type LayerVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerVisibilityToggledEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerItemVisibilityToggledEvent = {
    layerPath: string;
    itemName: string;
    visibility: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerItemVisibilityToggledEvent, void>;
//# sourceMappingURL=layer.d.ts.map