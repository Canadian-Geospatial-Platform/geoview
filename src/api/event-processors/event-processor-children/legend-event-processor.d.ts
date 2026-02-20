import type { Extent } from '@/api/types/map-schema-types';
import type { TemporalMode, TimeDimension, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import type { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the Layer state for a given map id
     * @param {string} mapId - The mapId
     * @returns {ILayerState} The Layer state
     */
    protected static getLayerState(mapId: string): ILayerState;
    static setSelectedLayersTabLayer(mapId: string, layerPath: string): void;
    static reorderLegendLayers(mapId: string): void;
    /**
     * Gets a specific state.
     * @param {string} mapId - The mapId
     * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state to get
     * @returns {string | boolean | null | undefined} The requested state
     */
    static getLayerPanelState(mapId: string, state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'): string | boolean | null | undefined;
    /**
     * Gets a legend layer.
     * @param {string} mapId - The mapId
     * @param {string} layerPath - The path of the layer to get
     * @returns {TypeLegendLayer | undefined} The requested legend layer
     */
    static getLegendLayerInfo(mapId: string, layerPath: string): TypeLegendLayer | undefined;
    /**
     * Gets the full legend layers list
     * @param {string} mapId - The mapId
     * @returns {TypeLegendLayer[]} The list of legend layers
     */
    static getLegendLayers(mapId: string): TypeLegendLayer[];
    /**
     * Gets the layer bounds for a layer path
     * @param {string} mapId - The map id
     * @param {string} layerPath - The layer path
     * @returns {Extent | undefined} The extent of the layer at the given path
     */
    static getLayerBounds(mapId: string, layerPath: string): Extent | undefined;
    /**
     * Calculates the geographic bounds of a layer identified by its layer path
     * and stores the result in the layer's state within the legend.
     * This method:
     *  1. Calls the MapViewer API to compute the layer's bounds.
     *  2. Validates that the computed bounds are finite.
     *  3. Locates the corresponding legend layer by its path.
     *  4. Updates the layer's `bounds` property.
     *  5. Persists the updated legend state.
     * @param {string} mapId - Identifier of the map instance containing the layer.
     * @param {string} layerPath - The unique hierarchical path of the layer whose
     *   bounds should be calculated and stored.
     */
    static calculateLayerBoundsAndSaveToStore(mapId: string, layerPath: string): void;
    /**
     * Retrieves the projection code for a specific layer.
     *
     * @param {string} mapId - The unique identifier of the map instance.
     * @param {string} layerPath - The path to the layer.
     * @returns {string | undefined} - The projection code of the layer, or `undefined` if not available.
     *
     * @description
     * This method fetches the Geoview layer for the specified layer path and checks if it has a `getMetadataProjection` method.
     * If the method exists, it retrieves the projection object and returns its code using the `getCode` method.
     * If the projection or its code is not available, the method returns `undefined`.
     */
    static getLayerServiceProjection(mapId: string, layerPath: string): string | undefined;
    /**
     * Sets the layer bounds for a layer path
     * @param {string} mapId - The map id
     * @param {string} layerPath - The layer path
     * @param {Extent | undefined} bounds - The extent of the layer at the given path
     */
    static setLayerBounds(mapId: string, layerPath: string, bounds: Extent | undefined): void;
    /**
     * Sets the layer queryable.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {boolean} queryable - The queryable state to set.
     */
    static setLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void;
    /**
     * Updates the "queryable" state of a layer in the store for a given map.
     * Finds the layer by its `layerPath` in the legend layers of the specified `mapId`.
     * If the layer exists, updates its `queryable` property and writes the updated
     * legend layers back to the store.
     * @param {string} mapId - The ID of the map whose layer state should be updated.
     * @param {string} layerPath - The unique path/identifier of the layer to update.
     * @param {boolean} queryable - The new queryable state to set for the layer.
     */
    static setLayerQueryableInStore(mapId: string, layerPath: string, queryable: boolean): void;
    /**
     * Sets the layer hoverable.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {boolean} queryable - The queryable state to set.
     */
    static setLayerHoverable(mapId: string, layerPath: string, queryable: boolean): void;
    /**
     * Updates the "hoverable" state of a layer in the store for a given map.
     * Finds the layer by its `layerPath` in the legend layers of the specified `mapId`.
     * If the layer exists, updates its `hoverable` property and writes the updated
     * legend layers back to the store.
     * @param {string} mapId - The ID of the map whose layer state should be updated.
     * @param {string} layerPath - The unique path/identifier of the layer to update.
     * @param {boolean} hoverable - The new hoverable state to set for the layer.
     */
    static setLayerHoverableInStore(mapId: string, layerPath: string, hoverable: boolean): void;
    /**
     * Retrieves the display date format configured for a specific layer.
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The unique path identifying the layer.
     * @returns {TypeDisplayDateFormat | undefined} The configured display date format
     * for the layer, or `undefined` if the layer is not found or no format is set.
     */
    static getLayerDisplayDateFormat(mapId: string, layerPath: string): TypeDisplayDateFormat | undefined;
    /**
     * Applies a display date format to a layer through the map viewer layer API.
     * This method forwards the request to the map viewer, allowing the layer
     * implementation to react to the new display date format (e.g. for rendering
     * or querying purposes).
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The unique path identifying the layer.
     * @param {TypeDisplayDateFormat} displayDateFormat - The date format to apply
     * when displaying date values for the layer.
     */
    static setLayerDisplayDateFormat(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Persists the display date format for a specific layer in the application store.
     * This updates the legend layer state so that the selected display date format
     * is retained and can be reused by UI components (e.g. legends, tooltips)
     * without directly interacting with the map viewer.
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The unique path identifying the layer.
     * @param {TypeDisplayDateFormat} displayDateFormat - The date format to store
     * for displaying date values associated with the layer.
     */
    static setLayerDisplayDateFormatInStore(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Persists the display date format (short) for a specific layer in the application store.
     * Short means the date should be displayed in a more compact format.
     * This updates the legend layer state so that the selected display date format
     * is retained and can be reused by UI components (e.g. legends, tooltips)
     * without directly interacting with the map viewer.
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The unique path identifying the layer.
     * @param {TypeDisplayDateFormat} displayDateFormat - The date format to store
     * for displaying date values associated with the layer.
     */
    static setLayerDisplayDateFormatShortInStore(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Persists the date temporal mode for a specific layer in the application store.
     * This updates the legend layer state so that the selected temporal mode
     * is retained and can be reused by UI components (e.g. legends, tooltips)
     * without directly interacting with the map viewer.
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The unique path identifying the layer.
     * @param {TemporalMode} temporalMode - The date format to store
     * for displaying date values associated with the layer.
     */
    static setLayerDateTemporalInStore(mapId: string, layerPath: string, temporalMode: TemporalMode): void;
    /**
     * Sets the layersAreLoading flag in the store
     * @param {string} mapId - The map id
     * @param {boolean} areLoading - Indicator if any layer is currently loading
     */
    static setLayersAreLoading(mapId: string, areLoading: boolean): void;
    /**
     * Gets the extent of a feature or group of features
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path
     * @param {number[]} objectIds - The IDs of features to get extents from.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the feature, if available
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: number[], outfield?: string): Promise<Extent>;
    /**
     * Retrieves the time dimension information for a specific layer.
     *
     * @param {string} mapId - The unique identifier of the map instance.
     * @param {string} layerPath - The path to the layer.
     * @returns {TimeDimension | undefined} - The temporal dimension information of the layer, or `undefined` if not available.
     * @description
     * This method fetches the Geoview layer for the specified layer path (if it exists) and checks if it has a `getTimeDimension` method.
     * If the method exists, it retrieves the temporal dimension information for the layer.
     * If the layer doesn't support temporal dimensions, the method returns `undefined`.
     * @remarks This function returns the layer time dimension unrelated to the processing in the time-slider
     * (see TimeSliderEventProcessor.getInitialTimeSliderValues).
     */
    static getLayerTimeDimension(mapId: string, layerPath: string): TimeDimension | undefined;
    /**
     * Gets the legend icon images for a given layer legend
     * @param {TypeLegend | null | undefined} layerLegend - The legend of the layer
     * @returns {TypeLegendLayerItem[] | undefined} The legend icon images details
     */
    static getLayerIconImage(layerLegend: TypeLegend | null | undefined): TypeLegendLayerItem[] | undefined;
    /**
     * This method propagates the information stored in the legend layer set to the store.
     *
     * @param {string} mapId - The map identifier.
     * @param {TypeLegendResultSetEntry} legendResultSetEntry - The legend result set that triggered the propagation.
     */
    static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void;
    /**
     * Sets the highlighted layer state.
     * @param {string} mapId - The ID of the map
     * @param {string} layerPath - The layer path to set as the highlighted layer
     */
    static setHighlightLayer(mapId: string, layerPath: string): void;
    /**
     * Finds a legend layer by a layerPath.
     * @param {TypeLegendLayer[]} layers - The legend layers to search.
     * @param {string} layerPath - The path of the layer.
     * @returns {TypeLegendLayer | undefined}
     */
    static findLayerByPath(layers: TypeLegendLayer[], layerPath: string): TypeLegendLayer | undefined;
    /**
     * Recursively traverses a hierarchy of legend layers and returns a flat lookup
     * object indexed by `layerPath`.
     * All layers that contain a defined `layerPath` will be included in the result,
     * including nested children at any depth.
     * If duplicate `layerPath` values exist (shouldn't happen by design), later occurrences will overwrite earlier ones.
     * @param {TypeLegendLayer[]} layers - The top-level legend layers to traverse.
     * @returns {Record<string, TypeLegendLayer>} A record keyed by `layerPath`, where each value is the corresponding `TypeLegendLayer`.
     * @static
     */
    static findAllLayers(layers: TypeLegendLayer[]): Record<string, TypeLegendLayer>;
    /**
     * Delete layer from legend layers.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     */
    static deleteLayerFromLegendLayers(mapId: string, layerPath: string): void;
    /**
     * Delete layer.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     */
    static deleteLayer(mapId: string, layerPath: string): void;
    /**
     * Reload layer.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to reload.
     */
    static reloadLayer(mapId: string, layerPath: string): void;
    /**
     * Refresh layer and reset states.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to refresh.
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    static refreshLayer(mapId: string, layerPath: string): void;
    /**
     * Set visibility of an item in legend layers.
     * @param {string} mapId - The ID of the map.
     * @param {TypeLegendItem} item - The item to change.
     * @param {boolean} visibility - The new visibility.
     * @param {string | undefined} classFilter - The new class filter.
     */
    static setItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem, visibility: boolean, classFilter: string | undefined): void;
    /**
     * Toggle visibility of an item.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {TypeLegendItem} item - The item to change.
     */
    static toggleItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem): void;
    /**
     * Sets the visibility of all items in the layer.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {boolean} visibility - The visibility.
     */
    static setAllItemsVisibility(mapId: string, layerPath: string, visibility: boolean): void;
    /**
     * Sets the opacity of the layer and its children in the store.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {number} opacity - The opacity to set.
     */
    static setOpacityInStore(mapId: string, layerPath: string, opacity: number): void;
    /**
     * Sets the opacity of a layer.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {number} opacity - The opacity to set.
     * @param {boolean} updateLegendLayers - Whether to update the legend layers or not
     */
    static setLayerOpacity(mapId: string, layerPath: string, opacity: number, updateLegendLayers?: boolean): void;
    /**
     * Sorts legend layers children recursively in given legend layers list.
     * @param {string} mapId - The ID of the map.
     * @param {TypeLegendLayer[]} legendLayerList - The list to sort.
     */
    static sortLegendLayersChildren: (mapId: string, legendLayerList: TypeLegendLayer[]) => void;
}
//# sourceMappingURL=legend-event-processor.d.ts.map