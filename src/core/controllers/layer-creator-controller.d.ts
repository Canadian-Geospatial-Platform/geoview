import { type EventDelegateBase } from '@/api/events/event-helper';
import { type MapConfigLayerEntry, type TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { MapViewer } from '@/geo/map/map-viewer';
export declare class LayerCreatorController extends AbstractMapViewerController {
    #private;
    /**
     * Creates an instance of the LayerCreator class.
     *
     * @param layerDomain - The layer domain to be used by the LayerCreator
     */
    constructor(mapViewer: MapViewer, layerDomain: LayerDomain);
    /**
     * Loads layers that were passed in with the map config.
     *
     * @param mapConfigLayerEntries - An optional array containing layers passed within the map config
     * @returns A promise that resolves when everything is done
     */
    loadListOfGeoviewLayer(mapConfigLayerEntries: MapConfigLayerEntry[]): Promise<void>;
    /**
     * Adds a Geoview Layer by GeoCore UUID.
     *
     * @param uuid - The GeoCore UUID to add to the map
     * @param layerEntryConfig - The optional layer configuration
     * @returns A promise that resolves with the added layer result or undefined when an error occurs
     */
    addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<GeoViewLayerAddedResult | undefined>;
    /**
     * Adds a layer to the map.
     *
     * This is the main method to add a GeoView Layer on the map. It handles all the processing, including the validations,
     * and makes sure to inform the layer sets about the layer. The result contains the instanciated GeoViewLayer along
     * with a promise that will resolve when the layer will be officially on the map.
     *
     * @param geoviewLayerConfig - The geoview layer configuration to add
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns The result of the addition of the geoview layer
     * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId
     */
    addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult;
    /**
     * Refreshes GeoCore layers.
     */
    reloadGeocoreLayers(): void;
    /**
     * Attempts to reload a layer.
     *
     * @param layerPath - The path to the layer to reload
     */
    reloadLayer(layerPath: string): void;
    /**
     * Removes all geoview layers from the map.
     */
    removeAllGeoviewLayers(): void;
    /**
     * Removes a layer from the map using its layer path. The path may point to the root geoview layer
     * or a sub layer.
     *
     * @param layerPath - The path or ID of the layer to be removed
     */
    removeLayerUsingPath(layerPath: string): void;
    /**
     * Show the errors that happened during layers loading.
     *
     * If it's an aggregate error, log and show all of them.
     * If it's a regular error, log and show only that error.
     *
     * @param error - The error to log and show
     * @param geoviewLayerId - The Geoview layer id for which the error happened
     */
    showLayerError(error: unknown, geoviewLayerId: string): void;
    /**
     * Creates an instance of a specific `AbstractGeoViewLayer` subclass based on the given GeoView layer configuration.
     *
     * This function determines the correct layer type from the configuration and instantiates it accordingly.
     *
     * @remarks
     * - This method currently supports GeoJSON, CSV, WMS, Esri Dynamic, Esri Feature, Esri Image, GeoTIFF
     *   ImageStatic, KML, WFS, WKB, OGC Feature, XYZ Tiles, and Vector Tiles.
     * - If the layer type is not supported, an error is thrown.
     * - TODO: Refactor to use the validated configuration with metadata already fetched.
     *
     * @param geoviewLayerConfig - The configuration object for the GeoView layer
     * @returns An instance of the corresponding `AbstractGeoViewLayer` subclass
     * @throws {NotSupportedError} When the configuration does not match any supported layer type
     */
    static createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer;
    /**
     * Converts a list of map configuration layer entries into an array of promises,
     * each resolving to one or more GeoView layer configuration objects.
     *
     * @param mapId - The unique identifier of the map instance this configuration applies to
     * @param language - The language setting used for layer labels and metadata
     * @param mapConfigLayerEntries - The array of layer entries to convert
     * @param errorCallback - Callback invoked when an error occurs during layer processing
     * @returns An array of promises, each resolving to a TypeGeoviewLayerConfig object
     */
    static convertMapConfigsToGeoviewLayerConfig(mapId: string, currentLayerIds: string[], language: TypeDisplayLanguage, mapConfigLayerEntries: MapConfigLayerEntry[], errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>[];
    /**
     * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
     *
     * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, RCS, or standard GeoView),
     * this function processes each entry accordingly and wraps the result in a `Promise`.
     * Errors encountered during asynchronous operations are handled via a provided callback.
     *
     * @param mapId - The unique identifier of the map instance this configuration applies to
     * @param language - The language setting used for layer labels and metadata
     * @param entry - The array of layer entry to convert
     * @param errorCallback - Callback invoked when an error occurs during layer processing
     * @returns A promise that resolves to a TypeGeoviewLayerConfig object
     */
    static convertMapConfigToGeoviewLayerConfig(mapId: string, currentLayerIds: string[], language: TypeDisplayLanguage, entry: MapConfigLayerEntry, errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>;
    /**
     * Registers a layer config added event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigAdded(callback: LayerBuilderDelegate): void;
    /**
     * Unregisters a layer config added event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigAdded(callback: LayerBuilderDelegate): void;
    /**
     * Registers a layer config error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigError(callback: LayerConfigErrorDelegate): void;
    /**
     * Unregisters a layer config error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigError(callback: LayerConfigErrorDelegate): void;
    /**
     * Registers a layer removed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerConfigRemoved(callback: LayerPathDelegate): void;
    /**
     * Unregisters a layer removed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerConfigRemoved(callback: LayerPathDelegate): void;
    /**
     * Registers a layer created event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerCreated(callback: LayerDelegate): void;
    /**
     * Unregisters a layer created event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerCreated(callback: LayerDelegate): void;
}
/** Represents the result of adding a GeoView layer. */
export type GeoViewLayerAddedResult = {
    /** The created GeoView layer instance. */
    layer: AbstractGeoViewLayer;
    /** A promise that resolves when the layer is fully loaded. */
    promiseLayer: Promise<void>;
};
/** Defines the event payload for the layer loaded delegate. */
export type LayerEvent = {
    /** The loaded layer. */
    layer: AbstractGVLayer;
};
/** Defines a delegate for the layer loaded event handler function signature. */
export type LayerDelegate = EventDelegateBase<LayerCreatorController, LayerEvent, void>;
/** Defines the event payload for the layer path delegate. */
export type LayerPathEvent = {
    /** The layer path. */
    layerPath: string;
    /** The layer name. */
    layerName: string;
};
/** Defines a delegate for the layer path event handler function signature. */
export type LayerPathDelegate = EventDelegateBase<LayerCreatorController, LayerPathEvent, void>;
/** Defines the event payload for the layer builder delegate. */
export type LayerBuilderEvent = {
    /** The built layer. */
    layer: AbstractGeoViewLayer;
};
/** Defines a delegate for the layer builder event handler function signature. */
export type LayerBuilderDelegate = EventDelegateBase<LayerCreatorController, LayerBuilderEvent, void>;
/** Defines the event payload for the layer config error delegate. */
export type LayerConfigErrorEvent = {
    /** The layer path (or the geoview layer id) depending when the error occurs in the process. */
    layerPath: string;
    /** The error message. */
    error: string;
};
/** Defines a delegate for the layer config error event handler function signature. */
export type LayerConfigErrorDelegate = EventDelegateBase<LayerCreatorController, LayerConfigErrorEvent, void>;
//# sourceMappingURL=layer-creator-controller.d.ts.map