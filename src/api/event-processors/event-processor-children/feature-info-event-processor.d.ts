import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, EventType } from '@/api/events/payloads/get-feature-info-payload';
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    /**
     * Static methode used to propagate feature info layer sets to the store..
     *
     * @param {string} mapId The map identifier of the resul set modified.
     * @param {string} layerPath The layer path that has changed.
     * @param {EventType} eventType The event type that triggered the layer set update.
     * @param {TypeFeatureInfoResultSets} resultSets The resul sets associated to the map.
     */
    static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets): void;
}
