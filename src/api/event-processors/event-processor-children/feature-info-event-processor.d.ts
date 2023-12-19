import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, EventType } from '@/api/events/payloads/get-feature-info-payload';
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets, isLegendData?: boolean): void;
}
