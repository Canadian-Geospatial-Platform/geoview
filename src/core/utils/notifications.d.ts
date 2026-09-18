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
    addNotificationMessage(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Adds a notification success.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationSuccess(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Adds a notification warning.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationWarning(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Adds a notification error.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    addNotificationError(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Display next message in snackbar message queue, if there is one.
     */
    displayNextSnackbarMessage(): void;
    /**
     * Displays a message in the snackbar and adds it to the notification panel.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    showMessage(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Displays a detailed INFO message in the snackbar while grouping a separate generic message in the notification panel.
     *
     * High-frequency progress updates would otherwise flood the notification panel with one entry per update. This lets
     * the snackbar carry live detail (e.g. a record count) while the panel regroups every update into a single generic
     * entry (with a count).
     *
     * INFO-only by design: the grouped panel entry does not increment the unread badge, so this must never be used for
     * warnings or errors (which must stay ungrouped via `showWarning`/`showError` so each one is surfaced and counted).
     *
     * @param snackbarKey - The message or locale key shown in the snackbar (detailed)
     * @param snackbarParams - Parameters for the snackbar message
     * @param notificationKey - The message or locale key added to the notification panel (generic)
     * @param notificationParams - Optional parameters for the notification-panel message
     */
    showInfoDetailedSnackbar(snackbarKey: string, snackbarParams: Record<string, unknown>, notificationKey: string, notificationParams?: Record<string, unknown>): void;
    /**
     * Displays a success message in the snackbar and adds it to the notification panel.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    showSuccess(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Displays a warning message in the snackbar and adds it to the notification panel.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    showWarning(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Displays an error message in the snackbar and adds it to the notification panel.
     *
     * @param messageKey - The message or a locale key to retrieve
     * @param params - Optional array of parameters to replace, i.e. ['short']
     */
    showError(messageKey: string, params?: Record<string, unknown>): void;
    /**
     * Displays an error which can be a GeoViewError or a generic Error.
     *
     * A {@link GeoViewError} carries a translated `messageKey`, so it is shown as a specific, actionable
     * message. Any other error falls through to {@link showErrorGeneric}, which is a LAST-RESORT FAILOVER:
     * it shows the vague "contact us or view console" message. Reaching that path means the underlying error
     * was never typed as a `GeoViewError` — fix the root cause by throwing a proper `GeoViewError` (or mapping
     * the system error to a specific message key) rather than relying on the generic message.
     *
     * @param error - The error to retrieve the message from and translate it
     */
    showErrorFromError(error: Error | unknown): void;
    /**
     * Displays a generic error message in the snackbar and adds it to the notification panel.
     *
     * This is a LAST-RESORT FAILOVER showing "An error happened, contact us or view console for details."
     * It is intentionally vague and misleading for end users — it should almost never be reached. Every time
     * it is, treat it as a bug: trace the originating error and replace it with a specific, translated
     * {@link GeoViewError} (or a dedicated message key) so the user gets an actionable message instead.
     */
    showErrorGeneric(): void;
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
export interface SnackBarOpenEvent {
    snackbarType: SnackbarType;
    message: string;
}
/** The supported snackbar message types. */
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';
/** Properties for a queued snackbar message. */
export type SnackbarProps = {
    type: SnackbarType;
    messageKey: string;
    params: Record<string, unknown>;
};
export {};
//# sourceMappingURL=notifications.d.ts.map