import { NotificationType } from '@/core/components/notifications/notifications';
import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { generateId, getLocalizedMessage } from './utilities';
import { logger } from './logger';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

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
      key: generateId(18),
      notificationType: type,
      message: getLocalizedMessage(message, AppEventProcessor.getDisplayLanguage(this.mapId), params),
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
    button?: ISnackbarButton
  ): void {
    const snackbar: SnackBarOpenEvent = {
      snackbarType: type,
      message: getLocalizedMessage(message, AppEventProcessor.getDisplayLanguage(this.mapId), params),
      button,
    };
    // Emit
    this.#emitSnackbarOpen(snackbar);
  }

  /**
   * Displays a message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showMessage(
    message: string,
    params: TypeJsonValue[] | TypeJsonArray | string[] = [],
    withNotification: boolean = true,
    button: ISnackbarButton = {}
  ): void {
    // Redirect
    this.#showSnackbarMessage('info', message, params, button);
    if (withNotification) this.addNotificationMessage(message, params);
  }

  /**
   * Displays an success message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showSuccess(
    message: string,
    params: TypeJsonValue[] | TypeJsonArray | string[] = [],
    withNotification: boolean = true,
    button: ISnackbarButton = {}
  ): void {
    // Redirect
    this.#showSnackbarMessage('success', message, params, button);
    if (withNotification) this.addNotificationSuccess(message, params);
  }

  /**
   * Displays an warning message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {sTypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showWarning(
    message: string,
    params: TypeJsonValue[] | TypeJsonArray | string[] = [],
    withNotification: boolean = true,
    button: ISnackbarButton = {}
  ): void {
    // Redirect
    this.#showSnackbarMessage('warning', message, params, button);
    if (withNotification) this.addNotificationWarning(message, params);
  }

  /**
   * Displays an error message in the snackbar
   *
   * @param {string} message - The message or a locale key to retrieve
   * @param {TypeJsonValue[] | TypeJsonArray | string[]} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showError(
    message: string,
    params: TypeJsonValue[] | TypeJsonArray | string[] = [],
    withNotification: boolean = true,
    button: ISnackbarButton = {}
  ): void {
    // Redirect
    this.#showSnackbarMessage('error', message, params, button);
    if (withNotification) this.addNotificationError(message, params);
  }

  /**
   * Displays an error which can be a GeoViewError or a generic Error.
   *
   * @param {Error | unknown} error - The error containing the message already formatted to display
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showErrorGeoView(error: Error | unknown, withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // TODO: Work in progress? Not used for now.
    // TO.DOCONT: Discuss how we want to do this.... show a custom message vs show a generic message (obfuscating the real error) vs show the real error when it happens
    // If a GeoViewError
    if (error instanceof GeoViewError) {
      // Show the GeoViewError message
      this.showError(error.message, [], withNotification, button);
    } else {
      // Show a generic error
      this.showErrorGeneric(withNotification, button);
    }
  }

  /**
   * Displays a generic error message in the snackbar
   *
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   */
  showErrorGeneric(withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#showSnackbarMessage('error', 'error.generic', [], button);
    if (withNotification) this.addNotificationError('error.generic', []);
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
