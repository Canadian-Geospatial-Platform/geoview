import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeSupportedTheme } from '@/core/types/cgpv-types';
export declare class AppEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static addAppNotification(mapId: string, notification: NotificationDetailsType): void;
    static getDisplayLanguage(mapId: string): TypeDisplayLanguage;
    static getTheme(mapId: string): TypeSupportedTheme;
    static getSupportedLanguages(mapId: string): TypeDisplayLanguage[];
    static setAppIsCrosshairActive(mapId: string, isActive: boolean): void;
    static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): void;
    static toggleFullscreen(mapId: string, active: boolean, element: TypeHTMLElement): void;
}
