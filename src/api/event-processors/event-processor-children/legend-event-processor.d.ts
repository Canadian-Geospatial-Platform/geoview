import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeLegendResultSetsEntry } from '@/api/events/payloads';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    static semaphoreInitialLoad: boolean;
    static timeDelayBeforeSelectingLayerInStore: number;
    private static getLayerIconImage;
    static propagateLegendToStore(mapId: string, layerPath: string, legendResultSetsEntry: TypeLegendResultSetsEntry): Promise<void>;
}
