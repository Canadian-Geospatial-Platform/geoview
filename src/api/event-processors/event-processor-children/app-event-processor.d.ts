import { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/config/types/map-schema-types';
import { IAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { NotificationDetailsType } from '@/core/components';
import { TypeHTMLElement } from '@/core/types/global-types';
import { SnackbarType } from '@/core/utils/notifications';
export declare class AppEventProcessor extends AbstractEventProcessor {
    /**
     * Shortcut to get the App state for a given map id
     * @param {string} mapId The mapId
     * @returns {IAppState} The App state.
     */
    protected static getAppState(mapId: string): IAppState;
    /**
     * Shortcut to get the App state for a given map id
     * @param {string} mapId - The mapId
     * @returns {IAppState} The App state.
     */
    protected static getAppStateAsync(mapId: string): Promise<IAppState>;
    /**
     * Shortcut to get the display language for a given map id
     * @param {string} mapId - The mapId
     * @returns {TypeDisplayLanguage} The display language.
     */
    static getDisplayLanguage(mapId: string): TypeDisplayLanguage;
    /**
     * Shortcut to get the display theme for a given map id
     * @param {string} mapId - The mapId
     * @returns {TypeDisplayTheme} The display theme.
     */
    static getDisplayTheme(mapId: string): TypeDisplayTheme;
    /**
     * Shortcut to get the display theme for a given map id
     * @param {string} mapId - The mapId
     * @returns {TypeDisplayTheme} The display theme.
     */
    static getShowUnsymbolizedFeatures(mapId: string): boolean;
    /**
     * Adds a snackbar message (optional add to notification).
     * @param {SnackbarType} type - The type of message.
     * @param {string} message - The message.
     * @param {string} param - Optional param to replace in the string if it is a key
     * @param {boolean} notification - True if we add the message to notification panel (default false)
     */
    static addMessage(mapId: string, type: SnackbarType, message: string, param?: string[], notification?: boolean): void;
    static addNotification(mapId: string, notif: NotificationDetailsType): Promise<void>;
    static removeNotification(mapId: string, key: string): void;
    static removeAllNotifications(mapId: string): void;
    static setAppIsCrosshairActive(mapId: string, isActive: boolean): void;
    static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): Promise<void>;
    static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void;
    static setFullscreen(mapId: string, active: boolean, element?: TypeHTMLElement): void;
    static setCircularProgress(mapId: string, active: boolean): void;
    /**
     * Process the guide .md file and add the object to the store.
     * @param {string} mapId - ID of map to create guide object for.
     */
    static setGuide(mapId: string): Promise<void>;
}
