import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeLegendResultsSetEntry } from '@/api/events/payloads';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    static semaphoreInitialLoad: boolean;
    static timeDelayBeforeSelectingLayerInStore: number;
    private static getLayerIconImage;
    static propagateLegendToStore(mapId: string, layerPath: string, legendResultsSetEntry: TypeLegendResultsSetEntry): Promise<void>;
}
