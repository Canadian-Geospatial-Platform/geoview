import type { NotificationDetailsType, NotificationType } from '@/core/components/notifications/notifications';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { UIController } from '@/core/controllers/ui-controller';
import { generateId, getLocalizedMessage } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

/** Snackbar message keys for high-frequency progress updates that should never stack more than one in-progress snackbar. */
const PROGRESS_SNACKBAR_KEYS = ['layers.fetchProgress', 'dataTable.downloadAsGeoJSONProcessing'];

/** Class used to send message to user for a map. Can be a notification and/or a snackbar message. */
export class Notifications {
  /** The UI controller */
  #uiController: UIController;

  /** Snackbar messages to display. */
  snackbarMessageQueue: SnackbarProps[] = [];

  /** Keep all callback delegate references */
  #onSnackbarOpenHandlers: SnackBarOpenDelegate[] = [];

  /**
   * The class constructor to instanciate a notification class
   * @param uiController - The UI controller instance
   */
  constructor(uiController: UIController) {
    // Keep the controller, for actions.
    this.#uiController = uiController;
  }

  // #region NOTIFICATIONS

  /**
   * Reusable utility function to send event to add a notification in the notifications manager.
   *
   * @param type - The type of message (info, success, warning, error), info by default
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Array of parameters to replace, i.e. ['short']
   * @param groupSingleCount - When true, duplicates group into one panel entry without incrementing the unread badge count
   */
  #addNotification(type: NotificationType, messageKey: string, params: Record<string, unknown>, groupSingleCount = false): void {
    // Resolve the message once, reused for both logging and the notification
    const message = getLocalizedMessage(this.#uiController.getDisplayLanguage(), messageKey, params);

    // Log every notification to the console, by severity. A snackbar never exists without a notification,
    // so this is the single choke point that logs both snackbar messages and panel-only notifications.
    if (type === 'warning') logger.logWarning(message);
    else if (type === 'error') logger.logError(message);
    else logger.logInfo(message);

    const notification: NotificationDetailsType = {
      key: generateId(18),
      notificationType: type,
      message,
      count: 1,
      groupSingleCount,
    };

    // Proceed through the ui controller
    this.#uiController.addNotification(notification);
  }

  // NOTE: These 'addNotificationXXXX' and 'showXXXX' functions accept either a GeoView message key or
  // already-final raw text. Raw text (e.g. a plugin-provided string with spaces) is detected by
  // getLocalizedMessage and returned verbatim without a missing-key error, so external devs who don't
  // know the internal message keys can pass literal strings directly.

  /**
   * Adds a notification message.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  addNotificationMessage(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect
    this.#addNotification('info', messageKey, params);
  }

  /**
   * Adds a notification success.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  addNotificationSuccess(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect
    this.#addNotification('success', messageKey, params);
  }

  /**
   * Adds a notification warning.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  addNotificationWarning(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect
    this.#addNotification('warning', messageKey, params);
  }

  /**
   * Adds a notification error.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  addNotificationError(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect
    this.#addNotification('error', messageKey, params);
  }

  // #endregion NOTIFICATIONS

  // #region MESSAGES

  /**
   * Reusable utility function to send event to display a message in the snackbar.
   *
   * @param type - The type of snackbar
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Array of parameters to replace, i.e. ['short']
   */
  #showSnackbarMessage(type: SnackbarType, messageKey: string, params: Record<string, unknown>): void {
    // Get the localized message
    const message = getLocalizedMessage(this.#uiController.getDisplayLanguage(), messageKey, params);

    const snackbar = {
      snackbarType: type,
      message,
    };

    // Emit
    this.#emitSnackbarOpen(snackbar);
  }

  /**
   * Adds a snackbar message to the queue and displays it if it is the only one.
   *
   * @param type - The type of snackbar
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Array of parameters to replace, i.e. ['short']
   */
  #addSnackbarMessage(type: SnackbarType, messageKey: string, params: Record<string, unknown>): void {
    // Keep only one in-progress snackbar for high-frequency progress messages (fetch/export) so it doesn't stack duplicates
    if (
      PROGRESS_SNACKBAR_KEYS.includes(messageKey) &&
      this.snackbarMessageQueue.some((snackbarMessage) => snackbarMessage.messageKey === messageKey)
    ) {
      return;
    }

    // If the snackbar message queue is not overflowing, add to it
    if (this.snackbarMessageQueue.length <= 4) {
      // For multiple slow render warnings, replace individual layer messages with one generic one
      if (
        messageKey === 'warning.layer.slowRender' &&
        this.snackbarMessageQueue.find(
          (snackbarMessage) =>
            snackbarMessage.messageKey === 'warning.layer.slowRender' || snackbarMessage.messageKey === 'warning.layer.slowRenders'
        )
      ) {
        // Only replace messages in queue if there are more than one, otherwise the new message will be lost when snackbar closes
        if (this.snackbarMessageQueue.length > 1 && this.snackbarMessageQueue[0].messageKey !== 'warning.layer.slowRenders')
          this.snackbarMessageQueue = this.snackbarMessageQueue.filter(
            (snackbarMessage) => snackbarMessage.messageKey !== messageKey && snackbarMessage.messageKey !== 'warning.layer.slowRenders'
          );

        // eslint-disable-next-line no-param-reassign
        messageKey = 'warning.layer.slowRenders';
      }
      // For multiple slow metadata fetch warnings, replace individual layer messages with one generic one
      if (
        messageKey === 'warning.layer.metadataTakingLongTime' &&
        this.snackbarMessageQueue.find(
          (snackbarMessage) =>
            snackbarMessage.messageKey === 'warning.layer.metadataTakingLongTime' ||
            snackbarMessage.messageKey === 'warning.layer.metadatasTakingLongTime'
        )
      ) {
        // Only replace messages in queue if there are more than one, otherwise the new message will be lost when snackbar closes
        if (this.snackbarMessageQueue.length > 1 && this.snackbarMessageQueue[0].messageKey !== 'warning.layer.metadatasTakingLongTime')
          this.snackbarMessageQueue = this.snackbarMessageQueue.filter(
            (snackbarMessage) =>
              snackbarMessage.messageKey !== messageKey && snackbarMessage.messageKey !== 'warning.layer.metadatasTakingLongTime'
          );

        // eslint-disable-next-line no-param-reassign
        messageKey = 'warning.layer.metadatasTakingLongTime';
      }

      // Add the message to the queue
      this.snackbarMessageQueue.push({ type, messageKey, params });

      // Display the message if it is the only one
      if (this.snackbarMessageQueue.length === 1) this.displayNextSnackbarMessage();
    }
  }

  /**
   * Display next message in snackbar message queue, if there is one.
   */
  displayNextSnackbarMessage(): void {
    if (this.snackbarMessageQueue.length) {
      const nextMessage = this.snackbarMessageQueue[0];
      this.#showSnackbarMessage(nextMessage.type, nextMessage.messageKey, nextMessage.params);
    }
  }

  /**
   * Displays a message in the snackbar and adds it to the notification panel.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  showMessage(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect (logging is handled centrally in #addNotification)
    this.#addSnackbarMessage('info', messageKey, params);
    this.addNotificationMessage(messageKey, params);
  }

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
  showInfoDetailedSnackbar(
    snackbarKey: string,
    snackbarParams: Record<string, unknown>,
    notificationKey: string,
    notificationParams: Record<string, unknown> = {}
  ): void {
    // Detailed transient snackbar, generic grouped notification (logging is handled centrally in #addNotification).
    // groupSingleCount keeps the panel entry at count 1 so high-frequency updates don't inflate the unread badge.
    // INFO-only by design (type is hardcoded): warnings/errors must stay ungrouped via showWarning/showError.
    this.#addSnackbarMessage('info', snackbarKey, snackbarParams);
    this.#addNotification('info', notificationKey, notificationParams, true);
  }

  /**
   * Displays a success message in the snackbar and adds it to the notification panel.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  showSuccess(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect (logging is handled centrally in #addNotification)
    this.#addSnackbarMessage('success', messageKey, params);
    this.addNotificationSuccess(messageKey, params);
  }

  /**
   * Displays a warning message in the snackbar and adds it to the notification panel.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  showWarning(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect (logging is handled centrally in #addNotification)
    this.#addSnackbarMessage('warning', messageKey, params);
    this.addNotificationWarning(messageKey, params);
  }

  /**
   * Displays an error message in the snackbar and adds it to the notification panel.
   *
   * @param messageKey - The message or a locale key to retrieve
   * @param params - Optional array of parameters to replace, i.e. ['short']
   */
  showError(messageKey: string, params: Record<string, unknown> = {}): void {
    // Redirect (logging is handled centrally in #addNotification)
    this.#addSnackbarMessage('error', messageKey, params);
    this.addNotificationError(messageKey, params);
  }

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
  showErrorFromError(error: Error | unknown): void {
    // If a GeoViewError, we know we have messageKeys for us as that's how we build our Errors
    if (error instanceof GeoViewError) {
      // Show the GeoViewError message
      this.showError(error.messageKey, error.messageParams);
      return;
    }

    // Here it's either an Error System or unknown. If Error System, read the message.
    let message = error;
    if (error instanceof Error) {
      ({ message } = error);
    }

    // Log to the console (for devs)
    logger.logError(message);

    // Show a generic error, because the error systems aren't necessarily for user to see nor translated.
    this.showErrorGeneric();
  }

  /**
   * Displays a generic error message in the snackbar and adds it to the notification panel.
   *
   * This is a LAST-RESORT FAILOVER showing "An error happened, contact us or view console for details."
   * It is intentionally vague and misleading for end users — it should almost never be reached. Every time
   * it is, treat it as a bug: trace the originating error and replace it with a specific, translated
   * {@link GeoViewError} (or a dedicated message key) so the user gets an actionable message instead.
   */
  showErrorGeneric(): void {
    // Redirect
    this.#addSnackbarMessage('error', 'error.generic', {});
    this.addNotificationError('error.generic', {});
  }

  // #endregion MESSAGES

  // #region EVENTS

  /**
   * Emits a snackbar open event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitSnackbarOpen(event: SnackBarOpenEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSnackbarOpenHandlers, event);
  }

  /**
   * Registers a snackbar open event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSnackbarOpenHandlers, callback);
  }

  /**
   * Unregisters a snackbar open event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSnackbarOpenHandlers, callback);
  }

  // #endregion EVENTS
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
