import { ISnackbarButton, SnackbarType } from '@/api/events/payloads/snackbar-message-payload';
import { NotificationType } from '@/core/components/notifications/notifications';
import { generateId, getLocalizedMessage, replaceParams } from './utilities';
import { TypeJsonArray, TypeJsonValue } from '@/core/types/global-types';
import { api } from '@/app';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from './logger';

/**
 * Class used to send message to user for a map. CAn be a notification or a snackbar message
 * @class Notifications
 * @exports
 */
export class Notifications {
  mapId;

  /**
   * Construct a new notification class
   * @param {string} mapId - The map id
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  // #region NOTIFICATION MESSAGES

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

    if (localMessage === undefined) {
      logger.logDebug('ADD NOTIFICATION', 'no valid locale key');
    } else localMessage = message;

    // if params provided, replace them
    if (params.length > 0) localMessage = replaceParams(params, localMessage);

    return localMessage;
  }

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

    AppEventProcessor.addAppNotification(this.mapId, notification);
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
    button?: ISnackbarButton
  ): void {
    // Emit
    api.event.emitSnackbarOpen(this.mapId, type, this.#formatMessage(message, params), button);
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
    if (withNotification) this.addNotificationMessage(message);
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
    if (withNotification) this.addNotificationSuccess(message);
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
    if (withNotification) this.addNotificationWarning(message);
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
    if (withNotification) this.addNotificationError(message);
  }
  // #endregion NOTIFICATION MESSAGES
}
