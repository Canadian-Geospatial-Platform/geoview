import type { GeoviewStoreType } from '@/core/stores';
import type { GeoChartStoreByLayerPath, IGeochartState, TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export declare class GeochartEventProcessor extends AbstractEventProcessor {
    #private;
    static TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH: number;
    /**
     * Overrides initialization of the GeoChart Event Processor
     * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
     * @returns An array of the subscriptions callbacks which were created
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Checks if the Geochart plugin is iniitialized for the given map.
     * @param {string} mapId - The map id
     * @returns {boolean} True when the Geochart plugin is initialized.
     * @static
     */
    static isGeochartInitialized(mapId: string): boolean;
    /**
     * Shortcut to get the Geochart state for a given map id
     * @param {string} mapId - The mapId
     * @returns {IGeochartState} The Geochart state.
     * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
     * @static
     */
    protected static getGeochartState(mapId: string): IGeochartState;
    /**
     * Get a specific state.
     * @param {string} mapId - The mapId
     * @param {'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'} state - The state to get
     * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath} The requested state
     * @static
     */
    static getSingleGeochartState(mapId: string, state: 'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath;
    /**
     * Sets the selected layer path for a specific GeoChart map instance in the Zustand store.
     * @param {string} mapId - The unique identifier of the GeoChart map.
     * @param {string} layerPath - The path of the layer to set as selected.
     */
    static setSelectedGeochartLayerPath(mapId: string, layerPath: string): void;
    /**
     * Sets the default layers from configuration.
     * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
     * (to retrieve the configuration per layer faster).
     *
     * @param {string} mapId - The map id
     * @param {GeoViewGeoChartConfig[]} charts The array of JSON configuration for GeoChart
     * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
     * @static
     */
    static setGeochartCharts(mapId: string, charts: GeoViewGeoChartConfig[]): void;
    /**
     * Adds a GeoChart Configuration to the specified map id and layer path
     * @param {string} mapId - The map ID
     * @param {string} layerPath - The layer path
     * @param {GeoViewGeoChartConfig} chartConfig - The Geochart Configuration
     * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
     * @static
     */
    static addGeochartChart(mapId: string, layerPath: string, chartConfig: GeoViewGeoChartConfig): void;
    /**
     * Removes a GeoChart Configuration at the specified map id and layer path
     * @param {string} mapId - The map ID
     * @param {string} layerPath - The layer path
     * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
     * @static
     */
    static removeGeochartChart(mapId: string, layerPath: string): void;
}
//# sourceMappingURL=geochart-event-processor.d.ts.map