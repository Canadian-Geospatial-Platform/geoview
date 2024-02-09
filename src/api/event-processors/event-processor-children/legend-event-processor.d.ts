import { TypeLegendResultsSetEntry } from '@/api/events/payloads';
import { ILayerState } from '@/app';
import { AbstractEventProcessor } from '../abstract-event-processor';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    private static propagatedOnce;
    private static timeDelayBeforeSelectingLayerInStore;
    /**
     * Shortcut to get the Layer state for a given map id
     * @param {string} mapId The mapId
     * @returns {ILayerState} The Layer state
     */
    protected static getLayerState(mapId: string): ILayerState;
    private static getLayerIconImage;
    static propagateLegendToStore(mapId: string, layerPath: string, legendResultsSetEntry: TypeLegendResultsSetEntry): Promise<void>;
}
