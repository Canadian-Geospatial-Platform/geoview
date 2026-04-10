import type BaseLayer from 'ol/layer/Base';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { FitOptions } from 'ol/View';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { type EventDelegateBase } from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendItem } from '@/core/components/layers/types';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { ControllerLayerItemVisibilityChangedDelegate, LayerController } from '@/core/controllers/layer-controller';
import type { DomainLayerBaseDelegate, DomainLayerStatusChangedDelegate, LayerDomain } from '@/core/domains/layer-domain';
import type { GeoViewLayerAddedResult, LayerBuilderDelegate, LayerConfigErrorDelegate, LayerCreatorController, LayerDelegate, LayerPathDelegate } from '@/core/controllers/layer-creator-controller';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import type { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import type { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
/**
 * Public API facade for layer operations.
 *
 * Provides external consumers with a stable entry point for layer management,
 * querying, and event subscription. Internally delegates to controllers and
 * domains, re-emitting domain events so that external code can subscribe
 * without depending on internal architecture.
 */
export declare class LayerApi {
    #private;
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
     * Initializes the layer API and subscribes to domain and controller events.
     *
     * @param controllerRegistry - The controller registry for accessing controllers
     * @param layerDomain - The layer domain for event subscriptions
     * @param geometryApi - The geometry API for creating and managing geometries
     * @param featureHighlight - The feature highlight utility for feature and bounding box highlighting
     */
    constructor(controllerRegistry: ControllerRegistry, layerDomain: LayerDomain, geometryApi: GeometryApi, featureHighlight: FeatureHighlight);
    /**
     * Initializes the events on the domain to listen to changes and re-emit the events higher.
     * This is a shortcut to not have the event from the domain have to go through the controller
     * to be caught by the layer api.
     *
     * @param layerDomain - The layer domain to listen on
     */
    initEventsOnDomain(layerDomain: LayerDomain): void;
    /**
     * Initializes events on the layer creator controller to relay layer lifecycle events.
     *
     * Subscribes to layer config added, config error, config removed, and layer created
     * events from the controller and re-emits them for external consumers.
     *
     * @param layerCreatorController - The layer creator controller to listen on
     * @param layerController - The layer controller to listen on
     */
    initEventsOnLayerControllers(layerCreatorController: LayerCreatorController, layerController: LayerController): void;
    /**
     * Gets the GeoView Layer Ids / UUIDs.
     *
     * @returns The ids of the layers
     */
    getGeoviewLayerIds(): string[];
    /**
     * Gets the Layer Entry layer paths.
     *
     * @returns The GeoView Layer Paths
     */
    getLayerEntryLayerPaths(): string[];
    /**
     * Gets the Layer Entry Configs.
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
     * Adds a Geoview Layer by GeoCore UUID.
     *
     * @param uuid - The GeoCore UUID to add to the map
     * @param layerEntryConfig - The optional layer configuration
     * @returns A promise that resolves with the added layer result or undefined when an error occurs
     */
    addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<GeoViewLayerAddedResult | undefined>;
    /**
     * Removes all GeoView layers from the map.
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
     * Renames a layer.
     *
     * @param layerPath - The path of the layer.
     * @param name - The new name to use.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    setLayerName(layerPath: string, name: string): void;
    /**
     * Sets the opacity of a layer.
     *
     * @param layerPath - The path of the layer.
     * @param opacity - The new opacity value for the layer.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    setLayerOpacity(layerPath: string, opacity: number): void;
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
     * Updates the raster function for an ESRI Image layer.
     *
     * @param layerPath - The path of the layer.
     * @param rasterFunctionId - The raster function ID to apply or undefined to remove it.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer.
     */
    setLayerRasterFunction(layerPath: string, rasterFunctionId: string | undefined): void;
    /**
     * Loops through all geoview layers and refresh their respective source.
     * Use this function on projection change or other viewer modification who may affect rendering.
     */
    refreshLayers(): void;
    /**
     * Highlights all features of a layer on the map.
     *
     * @param layerPath - The path of the layer to highlight
     */
    highlightLayer(layerPath: string): void;
    /**
     * Removes highlights for a specific layer.
     *
     * @param layerPath - The path of the layer whose highlights to remove
     */
    removeLayerHighlights(layerPath: string): void;
    /**
     * Removes all layer highlights from the map.
     */
    removeHighlightLayer(): void;
    /**
     * Sets the date temporal mode for the specific layer.
     *
     * This updates the layer-level configuration used to control how date values
     * are interpreted.
     * The value is stored in the application state via the layerController.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param temporalMode - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDateTemporalMode(layerPath: string, temporalMode: TemporalMode): void;
    /**
     * Sets the date display format for a specific layer.
     *
     * This updates the layer-level configuration used to control how date values
     * are formatted when displayed (e.g., in legends, tooltips, or UI components).
     * The value is stored in the application state via the layerController.
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
     * The value is stored in the application state via the layerController.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param displayDateFormat - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void;
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
     * Zoom to extents of a layer.
     *
     * @param layerPath - The path of the layer to zoom to.
     * @param fitOptions - Optional fit options for zooming.
     * @returns A promise that resolves when the zoom operation is complete
     * @throws {NoBoundsError} When the layer doesn't have bounds.
     */
    zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void>;
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
     * @param waitForRender - If `true`, the promise resolves only after the
     * underlying layer has finished its next render cycle.
     * @returns A promise that resolves once the visibility has been applied,
     * optional legend store updated, filters applied, and render completed if requested
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setItemVisibility(layerPath: string, item: TypeLegendItem, visibility: boolean, waitForRender: boolean): Promise<void>;
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
     * @throws {LayerNotFoundError} When the layer cannot be found at the given path.
     */
    setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean;
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
     * Registers a layer error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerError(callback: LayerApiLayerErrorDelegate): void;
    /**
     * Unregisters a layer error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: LayerApiLayerErrorDelegate): void;
    /**
     * Registers a layer visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerVisibilityToggled(callback: LayerApiLayerVisibleChangedDelegate): void;
    /**
     * Unregisters a layer visibility toggled event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerVisibilityToggled(callback: LayerApiLayerVisibleChangedDelegate): void;
    /**
     * Registers a callback to be executed whenever the layer status is updated.
     *
     * @param callback - The callback function
     */
    onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void;
    /**
     * Unregisters a callback from being called whenever the layer status is updated.
     *
     * @param callback - The callback function to unregister
     */
    offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void;
    /**
     * Registers a layer all loaded/error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): void;
    /**
     * Unregisters a layer all loaded/error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): void;
    /**
     * Registers a layer first loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerFirstLoaded(callback: DomainLayerBaseDelegate): void;
    /**
     * Unregisters a layer first loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: DomainLayerBaseDelegate): void;
    /**
     * Registers a layer loading event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoading(callback: DomainLayerBaseDelegate): void;
    /**
     * Unregisters a layer loading event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: DomainLayerBaseDelegate): void;
    /**
     * Registers a layer loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoaded(callback: DomainLayerBaseDelegate): void;
    /**
     * Unregisters a layer loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: DomainLayerBaseDelegate): void;
    /**
     * Registers a layer config added event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @deprecated Stop using that hook, it's misleading as it's not a layer config that's added, it's a geoview-layer instance.
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
    /**
     * Registers a layer item visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerItemVisibilityToggled(callback: ControllerLayerItemVisibilityChangedDelegate): void;
    /**
     * Unregisters a layer item visibility toggled event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityToggled(callback: ControllerLayerItemVisibilityChangedDelegate): void;
}
/**
 * Define an event for the delegate
 */
export interface LayerApiLayerErrorEvent {
    layer: AbstractBaseGVLayer;
    error: GeoViewError;
}
/** Define a delegate for the layer visible changed event handler function signature. */
export type LayerApiLayerErrorDelegate = EventDelegateBase<LayerApi, LayerApiLayerErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export interface LayerApiLayerVisibleChangedEvent {
    layer: AbstractBaseGVLayer;
    visible: boolean;
}
/** Define a delegate for the layer visible changed event handler function signature. */
export type LayerApiLayerVisibleChangedDelegate = EventDelegateBase<LayerApi, LayerApiLayerVisibleChangedEvent, void>;
//# sourceMappingURL=layer.d.ts.map