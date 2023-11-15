import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeClickMarker } from '@/app';
export declare class MapEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static setMapLoaded(mapId: string): void;
    static clickMarkerIconHide(mapId: string): void;
    static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void;
}
