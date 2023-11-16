import { GeoViewStoreType } from '@/core/stores/geoview-store';
export declare abstract class AbstractEventProcessor {
    protected store: GeoViewStoreType | undefined;
    protected subscriptionArr: Array<() => void>;
    constructor();
    abstract onInitialize(store: GeoViewStoreType): void;
    onDestroy(): void;
}
