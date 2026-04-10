import type { EventDelegateBase } from '@/api/events/event-helper';
import type { UIController } from '@/core/controllers/ui-controller';
/** Class used to send message to user for a map. Can be a notification and/or a snackbar message. */
export declare class Notifications {
    #private;
    /** Snackbar messages to display. */
    snackbarMessageQueue: SnackbarProps[];
    /**
     * The class constructor to instanciate a notification class
     * @param uiController - The UI controller instance
     */
    constructor(uiController: UIController);
    /**
     * Adds a notification message.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationMessage(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification success.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationSuccess(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification warning.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationWarning(messageKey: string, params?: unknown[]): void;
    /**
     * Adds a notification error.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationError(messageKey: string, params?: unknown[]): void;
    /**
     * Display next message in snackbar message queue, if there is one.
     */
    displayNextSnackbarMessage(): void;
    /**
     * Displays a message in the snackbar.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showMessage(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays a success message in the snackbar.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showSuccess(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays a warning message in the snackbar.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showWarning(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an error message in the snackbar.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showError(messageKey: string, params?: unknown[], withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays an error which can be a GeoViewError or a generic Error.
     *
     * @param error - The error to retrieve the message from and translate it
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showErrorFromError(error: Error | unknown, withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Displays a generic error message in the snackbar.
     *
     * @param withNotification - Optional, indicates if the message should also be added as a notification (default true)
     * @param button - Optional snackbar button
     */
    showErrorGeneric(withNotification?: boolean, button?: ISnackbarButton): void;
    /**
     * Registers a snackbar open event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onSnackbarOpen(callback: SnackBarOpenDelegate): void;
    /**
     * Unregisters a snackbar open event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offSnackbarOpen(callback: SnackBarOpenDelegate): void;
}
/** Delegate for the snackbar open event handler function signature. */
type SnackBarOpenDelegate = EventDelegateBase<Notifications, SnackBarOpenEvent, void>;
/** Event payload for the snackbar open delegate. */
export type SnackBarOpenEvent = {
    snackbarType: SnackbarType;
    message: string;
    button?: ISnackbarButton;
};
/** Snackbar button properties interface. */
interface ISnackbarButton {
    label?: string;
    action?: () => void;
}
/** The supported snackbar message types. */
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';
/** Properties for a queued snackbar message. */
export type SnackbarProps = {
    type: SnackbarType;
    messageKey: string;
    params: unknown[];
    button?: ISnackbarButton;
};
export {};
//# sourceMappingURL=notifications.d.ts.map