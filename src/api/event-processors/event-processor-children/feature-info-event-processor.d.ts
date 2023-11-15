import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, EventType } from '@/api/events/payloads/get-feature-info-payload';
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static propagateResultSetInfo(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets): void;
}
