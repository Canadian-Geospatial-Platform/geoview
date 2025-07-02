import { GeoviewStoreType } from '@/core/stores';
import { GeoChartStoreByLayerPath, IGeochartState, TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { GeoChartConfig } from '@/core/utils/config/reader/uuid-config-reader';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export declare class GeochartEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Overrides initialization of the GeoChart Event Processor
     * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
     * @returns An array of the subscriptions callbacks which were created
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Shortcut to get the Geochart state for a given map id
     * @param {string} mapId The mapId
     * @returns {IGeochartState | undefined} The Geochart state. Forcing the return to also be 'undefined', because
     *                                       there will be no geochartState if the Geochart plugin isn't active.
     *                                       This helps the developers making sure the existence is checked.
     */
    protected static getGeochartState(mapId: string): IGeochartState | undefined;
    /**
     * Get a specific state.
     * @param {string} mapId - The mapId
     * @param {'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'} state - The state to get
     * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | undefined} The requested state
     */
    static getSingleGeochartState(mapId: string, state: 'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | undefined;
    /**
     * Sets the default layers from configuration.
     * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
     * (to retrieve the configuration per layer faster).
     *
     * @param {string} mapId the map id
     * @param {GeoChartConfig[]} charts The array of JSON configuration for GeoChart
     */
    static setGeochartCharts(mapId: string, charts: GeoChartConfig[]): void;
    /**
     * Adds a GeoChart Configuration to the specified map id and layer path
     * @param {string} mapId The map ID
     * @param {string} layerPath The layer path
     * @param {GeoChartConfig} chartConfig The Geochart Configuration
     */
    static addGeochartChart(mapId: string, layerPath: string, chartConfig: GeoChartConfig): void;
    /**
     * Removes a GeoChart Configuration at the specified map id and layer path
     * @param {string} mapId The map ID
     * @param {string} layerPath The layer path
     */
    static removeGeochartChart(mapId: string, layerPath: string): void;
}
//# sourceMappingURL=geochart-event-processor.d.ts.map