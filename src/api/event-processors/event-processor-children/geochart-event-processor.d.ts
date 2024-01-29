import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeJsonObject } from '@/core/types/global-types';
export declare class GeochartEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoviewStoreType): void;
    /**
     * Set the default layers from configuration.
     * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
     * (to retrieve the configuration per layer faster).
     *
     * @param {string} mapId the map id
     * @param {TypeJsonObject} charts The array of JSON configuration for geochart
     */
    static setGeochartCharts(mapId: string, charts: TypeJsonObject[]): void;
}
