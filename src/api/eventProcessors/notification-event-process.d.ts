import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
export declare class NotificationEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
}
