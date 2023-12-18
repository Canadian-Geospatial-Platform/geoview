import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeDisplayTheme } from '@/core/types/cgpv-types';
export declare class AppEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoviewStoreType): void;
    static addAppNotification(mapId: string, notification: NotificationDetailsType): void;
    static getDisplayLanguage(mapId: string): TypeDisplayLanguage;
    static getDisplayTheme(mapId: string): TypeDisplayTheme;
    static getSupportedLanguages(mapId: string): TypeDisplayLanguage[];
    static setAppIsCrosshairActive(mapId: string, isActive: boolean): void;
    static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): void;
    static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void;
    static setFullscreen(mapId: string, active: boolean, element: TypeHTMLElement): void;
}
