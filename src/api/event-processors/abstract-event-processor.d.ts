import { GeoviewStoreType } from '@/core/stores/geoview-store';
export declare abstract class AbstractEventProcessor {
    protected store: GeoviewStoreType | undefined;
    protected subscriptionArr: Array<() => void>;
    constructor();
    onInitialize(store: GeoviewStoreType): void;
    onDestroy(store: GeoviewStoreType): void;
}
