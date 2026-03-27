import type BaseLayer from 'ol/layer/Base';
import type { Extent } from 'ol/extent';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { FitOptions } from 'ol/View';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { type TypeDisplayLanguage, type TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { MapConfigLayerEntry, TypeGeoviewLayerConfig, TypeLayerStatus, TypeMosaicRule } from '@/api/types/layer-schema-types';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { TypeLegendItem } from '@/core/components/layers/types';
import type { TypeFeatureInfoResultSet } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 */
export declare class LayerApi {
    #private;
    /** The opacity ratio to use when highlighting a layer vs the other layers */
    static readonly HIGHLIGHT_OPACITY_RATIO = 4;
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
     *
     * @param mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Gets the Map Identifier.
     *
     * @returns The map identifier
     */
    getMapId(): string;
    /**
     * Gets the GeoView Layer Ids / UUIDs.
     *
     * @returns The ids of the layers
     */
    getGeoviewLayerIds(): string[];
    /**
     * Verifies if a layer is registered. Returns true if registered.
     *
     * @param layerPath - The layer path to check.
     * @returns Returns true if the layer configuration is registered.
     */
    isLayerEntryConfigRegistered(layerPath: string): boolean;
    /**
     * Gets the Layer Entry layer paths
     *
     * @returns The GeoView Layer Paths
     */
    getLayerEntryLayerPaths(): string[];
    /**
     * Gets the Layer Entry Configs
     *
     * @returns The GeoView Layer Entry Configs
     */
    getLayerEntryConfigs(): ConfigBaseClass[];
    /**
     * Gets the layer configuration of the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     */
    getLayerEntryConfig(layerPath: string): ConfigBaseClass;
    /**
     * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     */
    getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     */
    getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig;
    /**
     * Gets the layer configuration of the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The layer configuration or undefined if not found.
     */
    getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined;
    /**
     * Gets the GeoView Layer Paths.
     *
     * @returns The layer paths of the GV Layers
     */
    getGeoviewLayerPaths(): string[];
    /**
     * Gets all GeoView Layers
     *
     * @returns The list of new Geoview Layers
     */
    getGeoviewLayers(): AbstractBaseGVLayer[];
    /**
     * Gets all GeoView layers that are regular layers (not groups).
     *
     * This method filters the list returned by `getGeoviewLayers()` and
     * returns only the layers that are instances of `AbstractGVLayer`.
     *
     * @returns An array containing only the regular layers from the current GeoView layer collection.
     */
    getGeoviewLayersRegulars(): AbstractGVLayer[];
    /**
     * Gets all GeoView layers that are group layers.
     *
     * This method filters the list returned by `getGeoviewLayers()` and
     * returns only the layers that are instances of `GVGroupLayer`.
     *
     * @returns An array containing only the group layers from the current GeoView layer collection.
     */
    getGeoviewLayersGroups(): GVGroupLayer[];
    /**
     * Gets all GeoView layers that are at the root.
     *
     * @returns An array containing only the layers at the root level of the registry.
     */
    getGeoviewLayersRoot(): AbstractBaseGVLayer[];
    /**
     * Returns the GeoView instance associated to the layer path.
     *
     * @param layerPath - The layer path
     * @returns The new Geoview Layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    getGeoviewLayer(layerPath: string): AbstractBaseGVLayer;
    /**
     * Returns the AbstractGVLayer instance associated to the layer path.
     *
     * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
     * An AbstractGVLayer is essentially a layer that's not a group layer.
     *
     * @param layerPath - The layer path
     * @returns The new Geoview Layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     */
    getGeoviewLayerRegular(layerPath: string): AbstractGVLayer;
    /**
     * Returns the GeoView Layer instance associated to the layer path.
     *
     * This returns an actual AbstractGVLayer (or undefined) and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
     * An AbstractGVLayer is essentially a layer that's not a group layer.
     *
     * @param layerPath - The layer path
     * @returns The AbstractGVLayer or undefined when not found
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     */
    getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined;
    /**
     * Returns the GeoView Layer instance associated to the layer path.
     *
     * @param layerPath - The layer path
     * @returns The AbstractBaseGVLayer or undefined when not found
     */
    getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined;
    /**
     * Returns the OpenLayer instance associated with the layer path.
     *
     * @param layerPath - The layer path to the layer's configuration.
     * @returns Returns the geoview instance associated to the layer path.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    getOLLayer(layerPath: string): BaseLayer;
    /**
     * Returns the OpenLayer instance associated with the layer path.
     *
     * @param layerPath - The layer path to the layer's configuration.
     * @returns Returns the geoview instance associated to the layer path.
     */
    getOLLayerIfExists(layerPath: string): BaseLayer | undefined;
    /**
     * Asynchronously returns the OpenLayer layer associated to a specific layer path.
     *
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
     *
     * @param layerPath - The layer path to the layer's configuration.
     * @param timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
     * @returns A promise that resolves to an OpenLayer layer associated to the layer path.
     */
    getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer>;
    /**
     * Load layers that was passed in with the map config
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
     * @param geoviewLayerConfig - The geoview layer configuration to add.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns The result of the addition of the geoview layer.
     * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId.
     */
    addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult;
    /**
     * Refreshes GeoCore Layers
     */
    reloadGeocoreLayers(): void;
    /**
     * Attempt to reload a layer.
     *
     * @param layerPath - The path to the layer to reload
     */
    reloadLayer(layerPath: string): void;
    /**
     * Registers the layer identifier.
     *
     * @param layerConfig - The layer entry config to register
     */
    registerLayerConfigInit(layerConfig: ConfigBaseClass): void;
    /**
     * Unregisters the layer in the LayerApi to stop managing it.
     *
     * @param layerConfig - The layer entry config to unregister
     * @param unregisterOrderedLayerInfo - Should it be unregistered from orderedLayerInfo
     */
    unregisterLayerConfig(layerConfig: ConfigBaseClass, unregisterOrderedLayerInfo?: boolean): void;
    /**
     * Checks if the layer results sets are all greater than or equal to the provided status
     *
     * @returns Indicates if all layers passed the callback and how many have passed the callback
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
     * Removes a layer from the map using its layer path. The path may point to the root geoview layer
     * or a sub layer.
     *
     * @param layerPath - The path or ID of the layer to be removed
     */
    removeLayerUsingPath(layerPath: string): void;
    /**
     * Highlights layer or sublayer on map
     *
     * @param layerPath - Identifier of layer to highlight
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    highlightLayer(layerPath: string): void;
    /**
     * Removes layer and feature highlights for a given layer.
     *
     * @param layerPath - The path of the layer to remove highlights from.
     */
    removeLayerHighlights(layerPath: string): void;
    /**
     * Removes layer or sublayer highlight
     */
    removeHighlightLayer(): void;
    /**
     * Gets the max extent of all layers on the map, or of a provided subset of layers.
     *
     * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
     * @returns A promise that resolves with the overall extent or undefined when no bounds are found
     */
    getExtentOfMultipleLayers(layerIds?: string[]): Promise<Extent | undefined>;
    /**
     * Zoom to extents of a layer.
     *
     * @param layerPath - The path of the layer to zoom to.
     * @param fitOptions - Optional fit options for zooming.
     * @returns A promise that resolves when the zoom operation is complete
     * @throws {NoBoundsError} When the layer doesn't have bounds.
     */
    zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void>;
    /**
     * Loops through all geoview layers and refresh their respective source.
     * Use this function on projection change or other viewer modification who may affect rendering.
     */
    refreshLayers(): void;
    /**
     * Sets the visibility of a single legend item on a regular (non-group) layer.
     *
     * This method updates the visibility of the specified item both in the underlying
     * layer's style configuration and optionally in the legend store. It can also
     * trigger the layer filters to be reapplied and optionally wait for the next
     * render cycle before resolving. Finally, it emits an event indicating the visibility
     * change.
     *
     * @param layerPath - The path identifying the target layer within the map.
     * @param item - The legend item whose visibility will be updated.
     * @param visibility - Whether the item should be visible.
     * @param refresh - If `true`, updates the legend layers store
     * to reflect this change (used to avoid repeated rerenders when updating multiple items).
     * @param waitForRender - If `true`, the promise resolves only after the
     * underlying layer has finished its next render cycle.
     * @returns A promise that resolves once the visibility has been applied,
     * optional legend store updated, filters applied, and render completed if requested
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setItemVisibility(layerPath: string, item: TypeLegendItem, visibility: boolean, refresh: boolean, waitForRender: boolean): Promise<void>;
    /**
     * Sets the visibility of all geoview layers on the map.
     *
     * @param newValue - The new visibility.
     */
    setAllLayersVisibility(newValue: boolean): void;
    /**
     * Sets or toggles the visibility of a layer within the current map.
     *
     * Retrieves the current visibility of the layer, determines the resulting visibility
     * based on the optional `newValue`, and applies the change only if the visibility
     * actually differs. If `newValue` is provided, the visibility is set explicitly;
     * if omitted, the method toggles the current visibility.
     *
     * @param layerPath - The path of the layer whose visibility is being updated.
     * @param newValue - Optional. The new visibility value to apply. If omitted, the current visibility is toggled.
     * @returns The resulting visibility state of the layer after the update
     * @throws {LayerNotFoundError} If the layer cannot be found at the given path.
     */
    setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean;
    /**
     * Renames a layer.
     *
     * @param layerPath - The path of the layer.
     * @param name - The new name to use.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    setLayerName(layerPath: string, name: string): void;
    /**
     * Sets opacity for a layer.
     *
     * @param layerPath - The path of the layer.
     * @param opacity - The new opacity to use.
     * @param emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    setLayerOpacity(layerPath: string, opacity: number, emitOpacityChange?: boolean): void;
    /**
     * Sets queryable state for a layer.
     *
     * @param layerPath - The path of the layer.
     * @param queryable - The new queryable state for the layer.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setLayerQueryable(layerPath: string, queryable: boolean): void;
    /**
     * Sets hoverable state for a layer.
     *
     * @param layerPath - The path of the layer.
     * @param hoverable - The new hoverable state for the layer.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setLayerHoverable(layerPath: string, hoverable: boolean): void;
    /**
     * Sets the date display format for a specific layer.
     *
     * This updates the layer-level configuration used to control how date values
     * are formatted when displayed (e.g., in legends, tooltips, or UI components).
     * The value is stored in the application state via the LegendEventProcessor.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param displayDateFormat - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void;
    /**
     * Sets the date display format (short) for a specific layer.
     *
     * Short means the date should be displayed in a more compact format.
     * This updates the layer-level configuration used to control how date values
     * are formatted when displayed (e.g., in legends, tooltips, or UI components).
     * The value is stored in the application state via the LegendEventProcessor.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param displayDateFormat - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void;
    /**
     * Sets the date temporal mode for the specific layer.
     *
     * This updates the layer-level configuration used to control how date values
     * are interpreted.
     * The value is stored in the application state via the LegendEventProcessor.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param temporalMode - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDateTemporalMode(layerPath: string, temporalMode: TemporalMode): void;
    /**
     * Updates the raster function for an ESRI Image layer.
     *
     * @param layerPath - The path of the layer.
     * @param rasterFunctionId - The raster function ID to apply or undefined to remove it.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer.
     */
    setLayerRasterFunction(layerPath: string, rasterFunctionId: string | undefined): void;
    /**
     * Sets the mosaic rule for an ESRI Image layer.
     *
     * @param layerPath - The layer path
     * @param mosaicRule - The mosaic rule to apply or undefined to remove it
     */
    setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void;
    /**
     * Sets the WMS style for a WMS layer.
     *
     * @param layerPath - The layer path
     * @param wmsStyle - The WMS style to apply
     */
    setLayerWmsStyle(layerPath: string, wmsStyle: string): void;
    /**
     * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
     *
     * @param layerPath - The path of the layer.
     * @param geojson - The new geoJSON.
     * @returns A promise that resolves when the geojson source has been set
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     * @throws {LayerNotGeoJsonError} When the layer is not a GeoJson layer.
     */
    setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): Promise<void>;
    /**
     * Redefine feature info fields.
     *
     * @param layerPath - The path of the layer.
     * @param fieldNames - The new field names to use.
     * @param fields - The fields to change.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths.
     * @throws {LayerNotQueryableError} When the layer configuration is not queryable.
     */
    redefineFeatureFields(layerPath: string, fieldNames: string[], fields: 'alias' | 'name'): void;
    /**
     * Replace outfield names, aliases and types with any number of new values, provided an identical count of each are supplied.
     *
     * @param layerPath - The path of the layer.
     * @param types - The new field types (TypeOutfieldsType) to use.
     * @param fieldNames - The new field names to use.
     * @param fieldAliases - Optional, the new field aliases to use.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths.
     * @throws {LayerNotQueryableError} When the layer configuration is not queryable.
     */
    replaceFeatureOutfields(layerPath: string, types: TypeOutfieldsType[], fieldNames: string[], fieldAliases?: string[]): void;
    /**
     * Show the errors that happened during layers loading.
     *
     * If it's an aggregate error, log and show all of them.
     * If it's a regular error, log and show only that error.
     *
     * @param error - The error to log and show.
     * @param geoviewLayerId - The Geoview layer id for which the error happened.
     */
    showLayerError(error: unknown, geoviewLayerId: string): void;
    /**
     * Clears any overridden CRS settings on all WMS layers in the map.
     *
     * Iterates through all GeoView layers, identifies those that are instances of `GVWMS`,
     * and resets their override CRS to `undefined`, allowing them to use the default projection behavior.
     */
    clearWMSLayersWithOverrideCRS(): void;
    /**
     * Clears all vector features from every layer in the All Feature Info Layer Set.
     */
    clearVectorFeaturesFromAllFeatureInfoLayerSet(): void;
    /**
     * Repeats the last feature info query.
     * This method waits for the layers to be loaded before performing the query.
     *
     * @returns A promise that resolves with the result of the query
     * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform.
     */
    repeatLastQuery(): Promise<TypeFeatureInfoResultSet>;
    /**
     * Repeats the last feature info query, if any.
     * This method waits for the layers to be loaded before performing the query.
     *
     * @returns A promise that resolves with the result of the query or undefined when no query to repeat
     */
    repeatLastQueryIfAny(): Promise<TypeFeatureInfoResultSet | undefined>;
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
    /**
     * Registers a callback to be executed whenever the layer status is updated.
     *
     * @param callback - The callback function
     */
    onLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Unregisters a callback from being called whenever the layer status is updated.
     *
     * @param callback - The callback function to unregister
     */
    offLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Registers a layer all loaded/error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerAllLoaded(callback: LayerConfigDelegate): void;
    /**
     * Unregisters a layer all loaded/error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAllLoaded(callback: LayerConfigDelegate): void;
    /**
     * Registers a layer first loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters a layer first loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Registers a layer loading event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoading(callback: LayerDelegate): void;
    /**
     * Unregisters a layer loading event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: LayerDelegate): void;
    /**
     * Registers a layer loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters a layer loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: LayerDelegate): void;
    /**
     * Registers a layer error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerError(callback: LayerErrorDelegate): void;
    /**
     * Unregisters a layer error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: LayerErrorDelegate): void;
    /**
     * Registers a layer visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void;
    /**
     * Unregisters a layer  visibility toggled event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void;
    /**
     * Registers a layer item visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void;
    /**
     * Unregisters a layer item visibility toggled event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void;
    /**
     * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
     *
     * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, RCS, or standard GeoView),
     * this function processes each entry accordingly and wraps the result in a `Promise`.
     * Errors encountered during asynchronous operations are handled via a provided callback.
     *
     * @param mapId - The unique identifier of the map instance this configuration applies to.
     * @param language - The language setting used for layer labels and metadata.
     * @param entry - The array of layer entry to convert.
     * @param errorCallback - Callback invoked when an error occurs during layer processing.
     * @returns A promise that resolves to a `TypeGeoviewLayerConfig` object
     */
    static convertMapConfigToGeoviewLayerConfig(mapId: string, language: TypeDisplayLanguage, entry: MapConfigLayerEntry, errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>;
    /**
     * Converts a list of map configuration layer entries into an array of promises,
     * each resolving to one or more GeoView layer configuration objects.
     *
     * @param mapId - The unique identifier of the map instance this configuration applies to.
     * @param language - The language setting used for layer labels and metadata.
     * @param mapConfigLayerEntries - The array of layer entries to convert.
     * @param errorCallback - Callback invoked when an error occurs during layer processing.
     * @returns An array of promises, each resolving to a `TypeGeoviewLayerConfig` object
     */
    static convertMapConfigsToGeoviewLayerConfig(mapId: string, language: TypeDisplayLanguage, mapConfigLayerEntries: MapConfigLayerEntry[], errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void): Promise<TypeGeoviewLayerConfig>[];
    /**
     * Generate an array of layer info for the orderedLayerList.
     *
     * @param geoviewLayerConfig - The config to get the info from.
     * @returns The array of ordered layer info
     */
    static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): TypeOrderedLayerInfo[];
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
     * @param geoviewLayerConfig - The configuration object for the GeoView layer.
     * @returns An instance of the corresponding `AbstractGeoViewLayer` subclass
     * @throws {NotSupportedError} When the configuration does not match any supported layer type.
     */
    static createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer;
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