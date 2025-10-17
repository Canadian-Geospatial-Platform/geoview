import type { EventDelegateBase } from '@/api/events/event-helper';
/**
 * Class used to send message to user for a map. Can be a notification and/or a snackbar message
 * @class Notifications
 * @exports
 */
export declare class Notifications {
    #private;
    mapId: string;
    snackbarMessageQueue: SnackbarProps[];
    /**
     * The class constructor to instanciate a notification class
     * @param {string} mapId - The map id
     */
    constructor(mapId: string);
    /**
     * Adds a notification message
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationMessage(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification success
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationSuccess(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification warning
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationWarning(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification error
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     */
    addNotificationError(messageKey: string, params?: unknown[]): void;
    /**
     * Display next message in snackbar message queue, if there is one
     */
    displayNextSnackbarMessage(): void;
    /**
     * Displays a message in the snackbar
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showMessage(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an success message in the snackbar
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showSuccess(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an warning message in the snackbar
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showWarning(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an error message in the snackbar
     * @param {string} messageKey - The message or a locale key to retrieve
     * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showError(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an error which can be a GeoViewError or a generic Error.
     * @param {Error | unknown} error - The error to retrieve the message from and translate it
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     * @param {ISnackbarButton} button - Optional snackbar button
     */
    showErrorFromError(error: Error | unknown, withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays a generic error message in the snackbar
     * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
     */
    showErrorGeneric(withNotification?: boolean, button?: ISnackbarButton): void;
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
export type SnackbarProps = {
    type: SnackbarType;
    messageKey: string;
    params: unknown[];
    button?: ISnackbarButton;
};
export {};
//# sourceMappingURL=notifications.d.ts.map