import type BaseLayer from 'ol/layer/Base';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import { type Extent, type TypeFeatureInfoEntryPartial } from '@/api/types/map-schema-types';
import type { TypeLayerStatus, TypeMosaicMethod, TypeMosaicOperation, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export declare class LayerController extends AbstractMapViewerController {
    #private;
    /** The opacity ratio to use when highlighting a layer vs the other layers */
    static readonly HIGHLIGHT_OPACITY_RATIO = 4;
    /**
     * Creates an instance of LayerController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller.
     * @param layerDomain - The layer domain instance to associate with this controller.
     */
    constructor(mapViewer: MapViewer, layerDomain: LayerDomain);
    /**
     * Hooks layer domain listeners.
     */
    protected onHook(): void;
    /**
     * Unhooks the controller from the action.
     */
    protected onUnhook(): void;
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
     * Retrieves the layer entry configuration for the given layer path.
     *
     * @param layerPath - The layer path to look up
     * @returns The ConfigBaseClass layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     */
    getLayerEntryConfig(layerPath: string): ConfigBaseClass;
    /**
     * Retrieves the layer entry configuration for the given layer path, if it exists.
     *
     * @param layerPath - The layer path to look up
     * @returns The ConfigBaseClass layer configuration, or undefined if not found
     */
    getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined;
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
     * Retrieves the Geoview layer for the given layer path.
     *
     * @param layerPath - The layer path to look up
     * @returns The Geoview layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    getGeoviewLayer(layerPath: string): AbstractBaseGVLayer;
    /**
     * Retrieves the Geoview layer for the given layer path, if it exists.
     *
     * @param layerPath - The layer path to look up
     * @returns The AbstractBaseGVLayer or undefined when not found
     */
    getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined;
    /**
     * Returns the AbstractGVLayer instance associated to the layer path.
     *
     * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
     * An AbstractGVLayer is essentially a layer that's not a group layer.
     *
     * @param layerPath - The layer path
     * @returns The AbstractGVLayer Layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     */
    getGeoviewLayerRegular(layerPath: string): AbstractGVLayer;
    /**
     * Returns the GeoView Layer instance associated to the layer path, if it exists.
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
     * Asynchronously returns the OpenLayer layer associated to a specific layer path.
     *
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
     *
     * @param layerPath - The layer path to the layer's configuration.
     * @param timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layer
     * @returns A promise that resolves to an OpenLayer layer associated to the layer path.
     */
    getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer>;
    /**
     * Gets the max extent of all layers on the map, or of a provided subset of layers.
     *
     * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
     * @returns A promise that resolves with the overall extent or undefined when no bounds are found
     */
    getExtentOfMultipleLayers(layerIds?: string[]): Promise<Extent | undefined>;
    /**
     * Gets the extent of a feature or group of features.
     *
     * @param layerPath - The layer path
     * @param objectIds - The IDs of features to get extents from
     * @param outfield - Optional ID field to return for services that require a value in outfields
     * @returns A promise that resolves with the extent of the features
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    getExtentFromFeatures(layerPath: string, objectIds: number[], outfield?: string): Promise<Extent>;
    /**
     * Retrieves the service (metadata) projection code for a specific raster layer.
     *
     * @param layerPath - The fully qualified path of the layer.
     * @returns The projection code (e.g., "EPSG:4326") defined in the layer's service metadata,
     *          or `undefined` if:
     *          - the layer does not exist,
     *          - the layer is not a raster layer,
     *          - or the metadata projection is not available.
     * @description
     *
     * This method looks up the GeoView layer associated with the provided `layerPath`.
     * If the layer exists and is an instance of `AbstractGVRaster`, it retrieves the
     * projection defined in the service metadata via `getMetadataProjection()`.
     * The projection code is then returned using `projection.getCode()`.
     */
    getLayerMetatadaProjectionEPSG(layerPath: string): string | undefined;
    /**
     * Gets the raster function previews for the ESRI image layer.
     *
     * @param layerPath - The layer path.
     * @returns The raster function previews.
     */
    getLayerRasterFunctionPreviews(layerPath: string): Map<string, Promise<string>>;
    /**
     * Checks if a layer has a text layer.
     *
     * @param layerPath - The layer path of the layer to check.
     * @returns True if the layer has a text layer, false otherwise.
     */
    getLayerHasText(layerPath: string): boolean;
    /**
     * Gets the text visibility state for a layer.
     *
     * @param layerPath - The layer path of the layer to check.
     * @returns True if text is visible, false otherwise. Returns undefined if layer has no text.
     */
    getLayerTextVisibility(layerPath: string): boolean | undefined;
    /**
     * Sets the text visibility for a layer.
     *
     * @param layerPath - The layer path of the layer to change.
     * @param visible - True to show text, false to hide text.
     */
    setLayerTextVisibility(layerPath: string, visible: boolean): void;
    /**
     * Sets the name of the layer indicated by the given layer path.
     *
     * @param layerPath - The layer path to set the queryable property
     * @param name - The value to set for the name property
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
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
     * Sets the queryable property of the layer indicated by the given layer path.
     *
     * @param layerPath - The layer path to set the queryable property
     * @param queryable - The value to set for the queryable property
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
     * Sets the ascending flag on the mosaic rule for a layer.
     *
     * @param layerPath - The layer path
     * @param value - Whether the mosaic order is ascending
     */
    setLayerMosaicRuleAscending(layerPath: string, value: boolean): void;
    /**
     * Sets the mosaic method on the mosaic rule for a layer.
     *
     * @param layerPath - The layer path
     * @param value - The mosaic method to set
     */
    setLayerMosaicRuleMethod(layerPath: string, value: TypeMosaicMethod): void;
    /**
     * Sets the mosaic operation on the mosaic rule for a layer.
     *
     * @param layerPath - The layer path
     * @param value - The mosaic operation to set
     */
    setLayerMosaicRuleOperation(layerPath: string, value: TypeMosaicOperation): void;
    /**
     * Sets the mosaic rule for an ESRI Image layer.
     *
     * @param layerPath - The layer path
     * @param mosaicRule - The mosaic rule to apply or undefined to remove it
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void;
    /**
     * Updates the visible-range settings (min/max zoom) of a GeoView layer and
     * stores whether the layer is currently within the visible range based on
     * the map's zoom level.
     *
     * Behavior:
     *  - Reads the layer's configuration to determine min/max zoom or min/max scale.
     *  - Converts scale-based limits into zoom levels when necessary.
     *  - Applies calculated `minZoom` and `maxZoom` to non-group layers only.
     *    (Group layers are skipped because their children already inherit the
     *     correct configuration and visibility is handled elsewhere.)
     *  - Computes whether the layer is currently in visible range and updates
     *    the store via `mapController`.
     *
     * @param gvLayer - The layer whose visibility
     *   range should be recalculated and stored.
     */
    setLayerInVisibleRange(gvLayer: AbstractBaseGVLayer): void;
    /**
     * Checks if the layer results sets are all greater than or equal to the provided status
     *
     * @returns Indicates if all layers passed the callback and how many have passed the callback
     */
    checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number];
    /**
     * Manually checks if all layers are loaded or error and update the store when so.
     *
     * @returns True if all layers are loaded
     */
    checkIfAllLayersLoadedAndUpdateStore(): boolean;
    /**
     * Loops through all geoview layers and refresh their respective source.
     * Use this function on projection change or other viewer modification who may affect rendering.
     */
    refreshLayers(): void;
    /**
     * Refreshes a layer and resets its states to their original configuration.
     *
     * This method performs the following steps:
     * 1. Retrieves the layer using the MapViewerLayer API.
     * 2. Calls the layer's `refresh` method to reload or redraw its data.
     * 3. Resets the layer's opacity and visibility to the values defined in its
     *    initial settings (defaulting to 1 for opacity and true for visibility).
     * 4. Updates all legend items' visibility if the layer is set to visible.
     *
     * @param layerPath - The layer path to refresh
     * @returns A promise that resolves once the layer has been refreshed,
     * its states reset, and its items rendered if visible
     * @throws {LayerNotFoundError} When the layer could not be found at the specified layer path.
     */
    resetLayer(layerPath: string): Promise<void>;
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
     * @param visible - Whether the item should be visible.
     * @param waitForRender - If `true`, the promise resolves only after the
     * underlying layer has finished its next render cycle.
     * @returns A promise that resolves once the visibility has been applied,
     * optional legend store updated, filters applied, and render completed if requested
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setItemVisibility(layerPath: string, item: TypeLegendItem, visible: boolean, waitForRender: boolean): Promise<void>;
    /**
     * Toggles the visibility of a legend item on a specific layer.
     *
     * Inverts the current visibility of the given item and updates the corresponding layer.
     * Delegates to the layer API and can optionally wait for the layer to finish rendering.
     *
     * @param layerPath - The layer path
     * @param item - The legend item whose visibility will be toggled
     * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
     * @returns A promise that resolves once the visibility change has been applied
     */
    toggleItemVisibility(layerPath: string, item: TypeLegendItem, waitForRender: boolean): Promise<void>;
    /**
     * Toggles the visibility of a legend item without waiting for the render to complete.
     *
     * @param layerPath - The layer path
     * @param item - The legend item whose visibility will be toggled
     */
    toggleItemVisibilityAndForget(layerPath: string, item: TypeLegendItem): void;
    /**
     * Sets the visibility of all legend items in a specific layer and optionally waits for rendering.
     *
     * This method performs the following steps:
     * 1. Ensures the layer itself is visible on the map.
     * 2. Updates the visibility of each item in the legend layer store and on the map.
     * 3. Triggers a re-render of the layer.
     * 4. Optionally waits for the next render cycle to complete before resolving.
     *
     * @param layerPath - The layer path
     * @param visibility - Whether all items in the layer should be visible
     * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
     * @returns A promise that resolves once all item visibilities have been updated and the layer has rendered if requested
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer was of wrong type.
     */
    setAllItemsVisibility(layerPath: string, visible: boolean, waitForRender: boolean): Promise<void>;
    /**
     * Sets the visibility of all legend items without waiting for the render to complete.
     *
     * @param layerPath - The layer path
     * @param visibility - Whether all items should be visible
     */
    setAllItemsVisibilityAndForget(layerPath: string, visibility: boolean): void;
    /**
     * Sets the highlighted layer state.
     *
     * Toggles or changes the highlighted layer. Only one layer can be highlighted at a time.
     *
     * @param layerPath - The layer path to set as the highlighted layer
     */
    setHighlightLayer(layerPath: string): void;
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
     * Clears any overridden CRS settings on all WMS layers in the map.
     *
     * Iterates through all GeoView layers, identifies those that are instances of `GVWMS`,
     * and resets their override CRS to `undefined`, allowing them to use the default projection behavior.
     */
    clearWMSLayersWithOverrideCRS(): void;
    /**
     * Sets the date temporal mode for the specific layer.
     *
     * This updates the layer-level configuration used to control how date values
     * are interpreted.
     * The value is stored in the application state via the LayerController.
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
     * The value is stored in the application state via the LayerController.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param displayDateFormat - The date format to apply for displaying date values associated with this layer.
     */
    setLayerDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void;
    /**
     * Sets the date display format (short) for a specific layer.
     *
     * Short means the date should be displayed in a more compact format.
     * This updates the layer-level configuration used to control how date values
     * are formatted when displayed (e.g., in legends, tooltips, or UI components).
     * The value is stored in the application state via the LayerController.
     *
     * @param layerPath - The unique path identifying the layer.
     * @param displayDateFormat - The date format to apply
     * for displaying date values associated with this layer.
     */
    setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void;
    /**
     * Sets the WMS style for a WMS layer.
     *
     * @param layerPath - The layer path
     * @param wmsStyle - The WMS style to apply, if any
     */
    setLayerWmsStyle(layerPath: string, wmsStyleName: string | undefined): void;
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
     * Queries the EsriDynamic layer at the given layer path for a specific set of object IDs.
     *
     * @param layerPath - The layer path of the layer to query
     * @param objectIDs - The object IDs to filter the query on
     * @returns A promise that resolves with an array of feature info entry records
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     * @throws {LayerNotEsriDynamicError} When the layer configuration isn't EsriDynamic.
     */
    queryLayerEsriDynamic(layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Starts the delayed deletion process for a layer, allowing a short
     * time window for the user to undo the operation.
     *
     * During this period:
     * - The layer is temporarily hidden.
     * - A deletion start timestamp is stored so the UI can derive progress locally.
     * - The user may abort the deletion via {@link deleteLayerAbort}.
     *
     * If the undo window expires, the layer is permanently deleted.
     * If called again for the same layer while a previous timer is running,
     * the previous timer is cancelled and a new one starts, preserving the
     * original visibility state from the first call.
     *
     * @param layerPath - Unique path identifying the layer within the map.
     * @param undoWindowDuration - Duration in milliseconds of the undo window before deletion is finalized.
     * @returns A promise resolving to:
     * - `true` if the deletion completed successfully.
     * - `false` if the deletion was aborted, superseded by a newer call, or
     *   if the layer was already in the deletion process.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    deleteLayerStartTimer(layerPath: string, undoWindowDuration: number): Promise<boolean>;
    /**
     * Aborts an ongoing layer deletion process if it has not yet been finalized.
     *
     * This restores the layer to its previous visibility state and stops
     * the deletion timer.
     *
     * @param layerPath - Unique path identifying the layer within the map.
     */
    deleteLayerAbort(layerPath: string): void;
    /**
     * Registers a layer item visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerItemVisibilityChanged(callback: ControllerLayerItemVisibilityChangedDelegate): void;
    /**
     * Unregisters a layer item visibility toggled event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityChanged(callback: ControllerLayerItemVisibilityChangedDelegate): void;
}
/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export declare function useLayerController(): LayerController;
/**
 * Define an event for the delegate
 */
export type ControllerLayerItemVisibilityChangedEvent = {
    layer: AbstractGVLayer;
    item: TypeLegendItem;
    visible: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type ControllerLayerItemVisibilityChangedDelegate = EventDelegateBase<LayerController, ControllerLayerItemVisibilityChangedEvent, void>;
//# sourceMappingURL=layer-controller.d.ts.map