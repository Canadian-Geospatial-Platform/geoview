import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/cgpv-types';
export declare abstract class AbstractEventProcessor {
    protected store: GeoviewStoreType | undefined;
    protected subscriptionArr: Array<() => void>;
    constructor();
    onInitialize(store: GeoviewStoreType): void;
    onDestroy(store: GeoviewStoreType): void;
    /**
     * ! Function available from all children class!!!
     * Use to get the map configuration
     *
     * @param {string} mapId the map id to retreive the config for
     * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
     */
    static getGeoViewConfig(mapId: string): TypeMapFeaturesConfig | undefined;
}
