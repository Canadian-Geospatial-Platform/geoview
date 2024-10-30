import { NotificationType } from '@/core/components/notifications/notifications';
import { TypeJsonArray, TypeJsonValue } from '@/core/types/global-types';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { generateId, getLocalizedMessage, replaceParams } from './utilities';
import { logger } from './logger';

/**
 * Class used to send message to user for a map. Can be a notification and/or a snackbar message
 * @class Notifications
 * @exports
 */
export class Notifications {
  mapId;

  // Keep all callback delegate references
  #onSnackbarOpendHandlers: SnackBarOpenDelegate[] = [];

  /**
   * The class constructor to instanciate a notification class
   * @param {string} mapId - The map id
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Check if message is a valid local key and apply paramter replacement.
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Array the parameters to replace
   * @returns {string} Formated and localized message if valid, the original message otherwise
   * @private
   */
  #formatMessage(message: string, params: TypeJsonValue[] | TypeJsonArray | string[]): string {
    // if message is a key, get localized value, if not return the string
    let localMessage = getLocalizedMessage(message, AppEventProcessor.getDisplayLanguage(this.mapId));

    // if params provided, replace them
    if (params.length > 0) localMessage = replaceParams(params, localMessage);

    return localMessage;
  }

  // #region NOTIFICATIONS
  /**
   * Reusable utility function to send event to add a notification in the notifications manager
   *
   * @param {NotificationType} type - The type of message (info, success, warning, error), info by default
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Array of parameters to replace, i.e. ['short']
   * @private
   */
  #addNotification(type: NotificationType, message: string, params: TypeJsonValue[] | TypeJsonArray | string[]): void {
    const notification = {
      key: generateId(),
      notificationType: type,
      message: this.#formatMessage(message, params),
      count: 1,
    };

    AppEventProcessor.addNotification(this.mapId, notification).catch((error) => {
      // Log
      logger.logPromiseFailed('addNotification in Notifications', error);
    });
  }

  /**
   * Add a notification message
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationMessage(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = []): void {
    // Redirect
    this.#addNotification('info', message, params);
  }

  /**
   * Add a notification success
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationSuccess(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = []): void {
    // Redirect
    this.#addNotification('success', message, params);
  }

  /**
   * Add a notification warning
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationWarning(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = []): void {
    // Redirect
    this.#addNotification('warning', message, params);
  }

  /**
   * Add a notification error
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationError(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = []): void {
    // Redirect
    this.#addNotification('error', message, params);
  }
  // #endregion NOTIFICATIONS

  // #region MESSAGES
  /**
   * Reusable utility function to send event to display a message in the snackbar
   *
   * @param {SnackbarType} snackbarType - The  type of snackbar
   * @param {string} message - The message or a locale key to retrieve
   * @param {string[]} params - Array of parameters to replace, i.e. ['short']
   * @param {ISnackbarButton} button - Optional snackbar button
   * @private
   */
  #showSnackbarMessage(
    type: SnackbarType,
    message: string,
    params: TypeJsonValue[] | TypeJsonArray | string[],
    button?: ISnackbarButton,
  ): void {
    const snackbar: SnackBarOpenEvent = {
      snackbarType: type,
      message: this.#formatMessage(message, params),
      button,
    };
    // Emit
    this.#emitSnackbarOpen(snackbar);
  }

  /**
   * Display a message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showMessage(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = [], withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('info', message, params, button);
    if (withNotification) this.addNotificationMessage(message, params);
  }

  /**
   * Display an success message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showSuccess(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = [], withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('success', message, params, button);
    if (withNotification) this.addNotificationSuccess(message, params);
  }

  /**
   * Display an warning message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {sTypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showWarning(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = [], withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('warning', message, params, button);
    if (withNotification) this.addNotificationWarning(message, params);
  }

  /**
   * Display an error message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {string} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showError(message: string, params: TypeJsonValue[] | TypeJsonArray | string[] = [], withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('error', message, params, button);
    if (withNotification) this.addNotificationError(message, params);
  }
  // #endregion MESSAGES

  // #region EVENTS
  /**
   * Emits a snackbar open event to all handlers.
   * @param {SnackBarOpenDelegate} event - The event to emit
   * @private
   */
  #emitSnackbarOpen(event: SnackBarOpenEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSnackbarOpendHandlers, event);
  }

  /**
   * Registers a snackbar open event handler.
   * @param {SnackBarOpenDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSnackbarOpendHandlers, callback);
  }

  /**
   * Unregisters a snackbar open event handler.
   * @param {SnackBarOpenDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSnackbarOpendHandlers, callback);
  }
  // #endregion EVENTS
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
