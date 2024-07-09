import { TypeJsonArray, TypeJsonValue } from '@/core/types/global-types';
import { EventDelegateBase } from '@/api/events/event-helper';
/**
 * Class used to send message to user for a map. Can be a notification and/or a snackbar message
 * @class Notifications
 * @exports
 */
export declare class Notifications {
    #private;
    mapId: string;
    /**
     * The class constructor to instanciate a notification class
     * @param {string} mapId - The map id
     */
    constructor(mapId: string);
    /**
     * Add a notification message
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationMessage(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[]): void;
    /**
     * Add a notification success
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationSuccess(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[]): void;
    /**
     * Add a notification warning
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationWarning(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[]): void;
    /**
     * Add a notification error
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationError(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[]): void;
    /**
     * Display a message in the snackbar
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showMessage(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[], withNotification?: boolean, button?: {}): void;
    /**
     * Display an success message in the snackbar
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showSuccess(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[], withNotification?: boolean, button?: {}): void;
    /**
     * Display an warning message in the snackbar
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {sTypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showWarning(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[], withNotification?: boolean, button?: {}): void;
    /**
     * Display an error message in the snackbar
     *
     * @param {string} message - The message or a locale key to retrieve
     * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showError(message: string, params?: TypeJsonValue[] | TypeJsonArray | string[], withNotification?: boolean, button?: {}): void;
    /**
     * Registers a snackbar open event handler.
     * @param {SnackBarOpenDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onSnackbarOpen(callback: SnackBarOpenDelegate): void;
    /**
     * Unregisters a snackbar open event handler.
     * @param {SnackBarOpenDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offSnackbarOpen(callback: SnackBarOpenDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type SnackBarOpenDelegate = EventDelegateBase<Notifications, SnackBarOpenEvent, void>;
/**
 * Define an event for the delegate
 */
export type SnackBarOpenEvent = {
    snackbarType: SnackbarType;
    message: string;
    button?: ISnackbarButton;
};
/**
 * Snackbar button properties interface
 */
interface ISnackbarButton {
    label?: string;
    action?: () => void;
}
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';
export {};
