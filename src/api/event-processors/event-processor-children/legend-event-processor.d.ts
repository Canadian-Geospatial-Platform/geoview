import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeLegendResultSetsEntry } from '@/api/events/payloads';
export declare class LegendEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    private static getLayerIconImage;
    static propagateLegendToStore(mapId: string, layerPath: string, legendResultSetsEntry: TypeLegendResultSetsEntry): void;
}
