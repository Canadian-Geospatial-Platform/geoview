import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { NotificationDetailsType } from '@/core/types/cgpv-types';
export declare class AppEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static setAppIsCrosshairActive(mapId: string, isActive: boolean): void;
    static addAppNotification(mapId: string, notification: NotificationDetailsType): void;
}
