import { Extent, TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the Layer state for a given map id
     * @param {string} mapId The mapId
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
     * Gets the layer bounds for a layer path
     * @param {string} mapId - The map id
     * @param {string} layerPath - The layer path
     * @returns {Extent | undefined} The extent of the layer at the given path
     */
    static getLayerBounds(mapId: string, layerPath: string): Extent | undefined;
    /**
     * Retrieves the default filter configuration for a specific layer entry.
     *
     * @param {string} mapId - The unique identifier of the map instance.
     * @param {string} layerPath - The path to the layer in the map configuration.
     * @returns {string | undefined} - The default filter for the layer entry, or `undefined` if not available.
     *
     * @description
     * This method fetches the layer entry configuration for the specified layer path and checks if it contains a `layerFilter` property.
     * If the property exists, its value is returned; otherwise, `undefined` is returned.
     */
    static getLayerEntryConfigDefaultFilter(mapId: string, layerPath: string): string | undefined;
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
     * Sets the layersAreLoading flag in the store
     * @param {string} mapId - The map id
     * @param {boolean} areLoading - Indicator if any layer is currently loading
     */
    static setLayersAreLoading(mapId: string, areLoading: boolean): void;
    /**
     * Gets the extent of a feature or group of features
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path
     * @param {string[]} objectIds - The IDs of features to get extents from.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the feature, if available
     */
    static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: string[], outfield?: string): Promise<Extent>;
    static getLayerIconImage(layerLegend: TypeLegend | null): TypeLegendLayerItem[] | undefined;
    /**
     * This method propagates the information stored in the legend layer set to the store.
     *
     * @param {string} mapId The map identifier.
     * @param {TypeLegendResultSetEntry} legendResultSetEntry The legend result set that triggered the propagation.
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
     * Refresh layer and reset states.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to refresh.
     */
    static refreshLayer(mapId: string, layerPath: string): void;
    /**
     * Set visibility of an item in legend layers.
     * @param {string} mapId - The ID of the map.
     * @param {TypeLegendItem} item - The item to change.
     * @param {boolean} visibility - The new visibility.
     */
    static setItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem, visibility?: boolean): void;
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
     * Sets the opacity of the layer.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {number} opacity - The opacity to set.
     */
    static setLayerOpacity(mapId: string, layerPath: string, opacity: number): void;
    /**
     * Sets the layer hoverable capacity.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {boolean} hoverable - The hoverable state to set.
     */
    static setLayerHoverable(mapId: string, layerPath: string, hoverable: boolean): void;
    /**
     * Sets the layer queryable capacity.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path of the layer to change.
     * @param {boolean} queryable - The queryable state to set.
     */
    static setLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void;
    /**
     * Filters features based on their visibility settings defined in the layer's unique value or class break style configuration.
     *
     * @static
     * @param {string} mapId - The unique identifier of the map instance
     * @param {string} layerPath - The path to the layer in the map configuration
     * @param {any[]} features - Array of features to filter
     *
     * @returns {any[]} Filtered array of features based on their visibility settings
     *
     * @description
     * This function processes features based on the layer's unique value style configuration:
     * - If the layer doesn't use unique value or class break styling, returns all features unchanged
     * - Features matching visible styles are included
     * - Features matching invisible styles are excluded
     * - Features with no matching style follow the defaultVisible setting
     */
    static getFeatureVisibleFromClassVibility(mapId: string, layerPath: string, features: TypeFeatureInfoEntry[]): TypeFeatureInfoEntry[];
    /**
     * Sorts legend layers children recursively in given legend layers list.
     * @param {string} mapId - The ID of the map.
     * @param {TypeLegendLayer[]} legendLayerList - The list to sort.
     */
    static sortLegendLayersChildren: (mapId: string, legendLayerList: TypeLegendLayer[]) => void;
}
