import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
export declare class MapEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static setMapLoaded(mapId: string): void;
}
