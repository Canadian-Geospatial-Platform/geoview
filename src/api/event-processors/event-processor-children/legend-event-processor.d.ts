import { Extent } from '@config/types/map-schema-types';
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
     * Sets the layer bounds for a layer path
     * @param {string} mapId - The map id
     * @param {string} layerPath - The layer path
     * @param {Extent | undefined} bounds - The extent of the layer at the given path
     */
    static setLayerBounds(mapId: string, layerPath: string, bounds: Extent): void;
    /**
     * Gets the extent of a feature or group of features
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path
     * @param {string[]} objectIds - The IDs of features to get extents from.
     * @returns {Promise<Extent | undefined>} The extent of the feature, if available
     */
    static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: string[]): Promise<Extent | undefined> | undefined;
    static getLayerIconImage(layerLegend: TypeLegend | null): TypeLegendLayerItem[] | undefined;
    /** ***************************************************************************************************************************
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
    static setItemVisibility(mapId: string, item: TypeLegendItem, visibility?: boolean): void;
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
}
