import type BaseLayer from 'ol/layer/Base';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { FitOptions } from 'ol/View';
import { type Extent, type TypeFeatureInfoEntryPartial } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeLayerStatus, TypeMosaicMethod, TypeMosaicOperation, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { type TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
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
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param layerDomain - The layer domain instance to associate with this controller
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
     * @returns The ConfigBaseClass layer configuration
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
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
     * @param layerPath - The layer path
     * @returns The layer configuration
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
     */
    getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
     *
     * @param layerPath - The layer path
     * @returns The layer configuration
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
     */
    getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig;
    /**
     * Gets the GeoView Layer Paths.
     *
     * @returns The layer paths of the GV Layers
     */
    getGeoviewLayerPaths(): string[];
    /**
     * Gets all GeoView layers.
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
     * @returns An array containing only the regular layers from the current GeoView layer collection
     */
    getGeoviewLayersRegulars(): AbstractGVLayer[];
    /**
     * Gets all GeoView layers that are group layers.
     *
     * This method filters the list returned by `getGeoviewLayers()` and
     * returns only the layers that are instances of `GVGroupLayer`.
     *
     * @returns An array containing only the group layers from the current GeoView layer collection
     */
    getGeoviewLayersGroups(): GVGroupLayer[];
    /**
     * Gets all GeoView layers that are at the root.
     *
     * @returns An array containing only the layers at the root level of the registry
     */
    getGeoviewLayersRoot(): AbstractBaseGVLayer[];
    /**
     * Retrieves the Geoview layer for the given layer path.
     *
     * @param layerPath - The layer path to look up
     * @returns The Geoview layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
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
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
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
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
     */
    getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined;
    /**
     * Asynchronously returns the OpenLayer layer associated to a specific layer path.
     *
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
     *
     * @param layerPath - The layer path to the layer's configuration
     * @param timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layer
     * @returns A promise that resolves to an OpenLayer layer associated to the layer path
     */
    getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer>;
    /**
     * Gets the max extent of all layers on the map, or of a provided subset of layers.
     *
     * @param layerIds - Identifiers or layerPaths of layers to get max extents from
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
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
     */
    getExtentFromFeatures(layerPath: string, objectIds: number[], outfield?: string): Promise<Extent>;
    /**
     * Retrieves the service (metadata) projection code for a specific raster layer.
     *
     * @param layerPath - The fully qualified path of the layer
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
     * @param layerPath - The layer path
     * @returns The raster function previews
     */
    getLayerRasterFunctionPreviews(layerPath: string): Map<string, Promise<string>>;
    /**
     * Checks if a layer has a text layer.
     *
     * @param layerPath - The layer path of the layer to check
     * @returns True if the layer has a text layer, false otherwise
     */
    getLayerHasText(layerPath: string): boolean;
    /**
     * Gets the text visibility state for a layer.
     *
     * @param layerPath - The layer path of the layer to check
     * @returns True if text is visible, false otherwise. Returns undefined if layer has no text
     */
    getLayerTextVisibility(layerPath: string): boolean | undefined;
    /**
     * Sets the text visibility for a layer.
     *
     * @param layerPath - The layer path of the layer to change
     * @param visible - True to show text, false to hide text
     */
    setLayerTextVisibility(layerPath: string, visible: boolean): void;
    /**
     * Sets the name of the layer indicated by the given layer path.
     *
     * @param layerPath - The layer path to set the queryable property
     * @param name - The value to set for the name property
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
     */
    setLayerName(layerPath: string, name: string): void;
    /**
     * Sets opacity for a layer.
     *
     * @param layerPath - The path of the layer
     * @param opacity - The new opacity to use
     * @param emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    setLayerOpacity(layerPath: string, opacity: number, emitOpacityChange?: boolean): void;
    /**
     * Sets the queryable property of the layer indicated by the given layer path.
     *
     * @param layerPath - The layer path to set the queryable property
     * @param queryable - The value to set for the queryable property
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
     */
    setLayerQueryable(layerPath: string, queryable: boolean): void;
    /**
     * Sets hoverable state for a layer.
     *
     * @param layerPath - The path of the layer
     * @param hoverable - The new hoverable state for the layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
     */
    setLayerHoverable(layerPath: string, hoverable: boolean): void;
    /**
     * Sets or toggles the visibility of a specific layer within a map.
     *
     * If the layer exists at the provided layer path for the given map, the method delegates
     * the visibility change to the map viewer's layer API. If `newValue` is provided, the layer
     * visibility is explicitly set to that value; otherwise, the visibility is toggled.
     *
     * @param layerPath - The path of the layer whose visibility is being changed
     * @param newValue - Optional. The new visibility value. If omitted, the visibility is toggled
     * @returns The resulting visibility state of the layer after the operation, or `false`
     * if the layer does not exist at the given path.
     */
    setOrToggleMapLayerVisibility(layerPath: string, newValue?: boolean): boolean;
    /**
     * Sets or toggles the visibility of a layer within the current map.
     *
     * Retrieves the current visibility of the layer, determines the resulting visibility
     * based on the optional `newValue`, and applies the change only if the visibility
     * actually differs. If `newValue` is provided, the visibility is set explicitly;
     * if omitted, the method toggles the current visibility.
     *
     * @param layerPath - The path of the layer whose visibility is being updated
     * @param newValue - Optional. The new visibility value to apply. If omitted, the current visibility is toggled
     * @returns The resulting visibility state of the layer after the update
     * @throws {LayerNotFoundError} When the layer cannot be found at the given path
     */
    setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean;
    /**
     * Sets the visibility of all geoview layers on the map.
     *
     * @param newValue - The new visibility
     */
    setAllLayersVisibility(newValue: boolean): void;
    /**
     * Sets the visibility of the Geoview basemap layer.
     *
     * @param newVisibility - The visibility state to apply to the basemap layer (`true` to show, `false` to hide)
     */
    setVisibilityOfGeoviewBasemapLayers(newVisibility: boolean): void;
    /**
     * Sets the visibility of **all layers** in a given map.
     *
     * Iterates through all GeoView layers associated with the specified map ID and
     * applies the provided visibility value. Only layers whose current visibility
     * differs from the desired state will be updated.
     *
     * @param newVisibility - The visibility state to apply to all layers (`true` to show, `false` to hide)
     */
    setAllMapLayerVisibility(newVisibility: boolean): void;
    /**
     * Sets the visibility of a layer in the store ordered layer info.
     *
     * @param layerPath - The layer path of the layer to change
     * @param visibility - The visibility to set
     */
    setMapLayerVisibility(layerPath: string, visibility: boolean): void;
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
    updateLayerInVisibleRange(gvLayer: AbstractBaseGVLayer): void;
    /**
     * Sets the visible range state for a layer and updates Z indices.
     *
     * @param layerPath - The path identifying the target layer
     * @param inVisibleRange - Whether the layer is within the visible zoom range
     */
    setLayerInVisibleRange(layerPath: string, inVisibleRange: boolean): void;
    /**
     * Sets Z index for layers.
     */
    setLayerZIndices(): void;
    /**
     * Replaces a layer in the orderedLayerInfo array.
     *
     * @param layerConfig - The config of the layer to add
     * @param layerPathToReplace - The layerPath of the info to replace
     */
    replaceOrderedLayerInfo(layerConfig: ConfigBaseClass, layerPathToReplace?: string): void;
    /**
     * Adds a new layer to the orderedLayerInfo array using a layer config.
     *
     * @param geoviewLayerConfig - The config of the layer to add
     */
    addOrderedLayerInfoByConfig(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig, index?: number): void;
    /**
     * Adds new layer info to the orderedLayerInfo array.
     *
     * @param layerInfo - The ordered layer info to add
     */
    addOrderedLayerInfo(layerInfo: TypeOrderedLayerInfo, index?: number): void;
    /**
     * Removes a layer from the orderedLayerInfo array.
     *
     * @param layerPath - The path of the layer to remove
     * @param removeSublayers - Should sublayers be removed
     */
    removeOrderedLayerInfo(layerPath: string, removeSublayers?: boolean): void;
    /**
     * Updates the ordered layer info in the store and recalculates layer Z indices.
     *
     * @param orderedLayerInfo - The new ordered layer info array
     * @deprecated This function shouldn't exist as it breaks the separation of concern between the controller and the store implementation.
     */
    setMapOrderedLayerInfoDirectly(orderedLayerInfo: TypeOrderedLayerInfo[]): void;
    /**
     * Reorders a layer by moving it up or down in the layer stack.
     *
     * @param layerPath - The layer path to reorder
     * @param move - The number of positions to move (positive = up, negative = down)
     */
    reorderLayer(layerPath: string, move: number): void;
    /**
     * Updates the raster function for an ESRI Image layer.
     *
     * @param layerPath - The path of the layer
     * @param rasterFunctionId - The raster function ID to apply or undefined to remove it
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer
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
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void;
    /**
     * Applies all available filters to layer.
     *
     * @param layerPath - The path of the layer to apply filters to
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
     */
    applyLayerFilters(layerPath: string): void;
    /**
     * Gets all active filters for layer.
     *
     * @param layerPath - The path for the layer to get filters from
     * @returns The active layer filters
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
     */
    getActiveFilters(layerPath: string): LayerFilters;
    /**
     * Checks if the layer results sets are all greater than or equal to the provided status.
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
     * @throws {LayerNotFoundError} When the layer could not be found at the specified layer path
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
     * @param layerPath - The path identifying the target layer within the map
     * @param item - The legend item whose visibility will be updated
     * @param visible - Whether the item should be visible
     * @param waitForRender - If `true`, the promise resolves only after the
     * underlying layer has finished its next render cycle.
     * @returns A promise that resolves once the visibility has been applied,
     * optional legend store updated, filters applied, and render completed if requested
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
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
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer was of wrong type
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
     * Highlights layer or sublayer on map.
     *
     * @param layerPath - Identifier of layer to highlight
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    highlightLayer(layerPath: string): void;
    /**
     * Updates or removes the layer highlight.
     *
     * @param layerPath - The layer path to set as the highlighted layer
     * @param highlightedLayerPath - The layer path of the currently highlighted layer
     * @returns The layer path of the highlighted layer
     */
    changeOrRemoveLayerHighlight(layerPath: string, highlightedLayerPath: string): string;
    /**
     * Removes layer and feature highlights for a given layer.
     *
     * @param layerPath - The path of the layer to remove highlights from
     */
    removeLayerHighlights(layerPath: string): void;
    /**
     * Removes layer or sublayer highlight.
     */
    removeHighlightLayer(): void;
    /**
     * Zooms to layer visible scale.
     *
     * @param layerPath - Path of layer to zoom to
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    zoomToLayerVisibleScale(layerPath: string): void;
    /**
     * Zooms to extents of a layer.
     *
     * @param layerPath - The path of the layer to zoom to
     * @throws {NoBoundsError} When the layer doesn't have bounds
     */
    zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void>;
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
     * @param layerPath - The unique path identifying the layer
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
     * @param layerPath - The unique path identifying the layer
     * @param displayDateFormat - The date format to apply for displaying date values associated with this layer
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
     * @param layerPath - The unique path identifying the layer
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
     * @param layerPath - The path of the layer
     * @param geojson - The new geoJSON
     * @returns A promise that resolves when the geojson source has been set
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
     * @throws {LayerNotGeoJsonError} When the layer is not a GeoJson layer
     */
    setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): Promise<void>;
    /**
     * Queries the EsriDynamic layer at the given layer path for a specific set of object IDs.
     *
     * @param layerPath - The layer path of the layer to query
     * @param objectIDs - The object IDs to filter the query on
     * @returns A promise that resolves with an array of feature info entry records
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
     * @throws {LayerNotEsriDynamicError} When the layer configuration isn't EsriDynamic
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
     * @param layerPath - Unique path identifying the layer within the map
     * @param undoWindowDuration - Duration in milliseconds of the undo window before deletion is finalized
     * @returns A promise resolving to:
     * - `true` if the deletion completed successfully.
     * - `false` if the deletion was aborted, superseded by a newer call, or
     *   if the layer was already in the deletion process.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    deleteLayerStartTimer(layerPath: string, undoWindowDuration: number): Promise<boolean>;
    /**
     * Aborts an ongoing layer deletion process if it has not yet been finalized.
     *
     * This restores the layer to its previous visibility state and stops
     * the deletion timer.
     *
     * @param layerPath - Unique path identifying the layer within the map
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
/** Defines the event payload for the layer item visibility changed delegate. */
export type ControllerLayerItemVisibilityChangedEvent = {
    /** The affected layer. */
    layer: AbstractGVLayer;
    /** The item being changed. */
    item: TypeLegendItem;
    /** The new visibility. */
    visible: boolean;
};
/** Defines a delegate for the layer item visibility changed event handler function signature. */
export type ControllerLayerItemVisibilityChangedDelegate = EventDelegateBase<LayerController, ControllerLayerItemVisibilityChangedEvent, void>;
//# sourceMappingURL=layer-controller.d.ts.map