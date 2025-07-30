import { NotificationType } from '@/core/components/notifications/notifications';
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

  // Snackbar messages to display
  snackbarMessageQueue: SnackbarProps[] = [];

  /** Keep all callback delegate references */
  #onSnackbarOpenHandlers: SnackBarOpenDelegate[] = [];

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
   * @param {NotificationType} type - The type of message (info, success, warning, error), info by default
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[]} params - Array of parameters to replace, i.e. ['short']
   * @private
   */
  #addNotification(type: NotificationType, messageKey: string, params: unknown[]): void {
    const notification = {
      key: generateId(18),
      notificationType: type,
      message: getLocalizedMessage(AppEventProcessor.getDisplayLanguage(this.mapId), messageKey, params),
      count: 1,
    };

    AppEventProcessor.addNotification(this.mapId, notification).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('addNotification in Notifications', error);
    });
  }

  // TODO: Refactor - Small problem. These 'addNotificationXXXX' and 'showXXXX' functions are public, but the outside devs don't know about the message keys.
  // TO.DOCONT: So when they try to do:
  // TO.DOCONT: cgpv.api.getMapViewer('map1').notifications.addNotificationSuccess(`${LYR_PATH_UNIQUE} visibility set to ${payload.visible} - individual`);
  // TO.DOCONT: For example, we log an error in logger about not having translation for 'that' messageKey which is not a message key.
  // TO.DOCONT: Provide a addNotificationUsingKey and a 'showXXXXUsingKey' alternatives?

  /**
   * Adds a notification message
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationMessage(messageKey: string, params: unknown[] = []): void {
    // Redirect
    this.#addNotification('info', messageKey, params);
  }

  /**
   * Adds a notification success
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationSuccess(messageKey: string, params: unknown[] = []): void {
    // Redirect
    this.#addNotification('success', messageKey, params);
  }

  /**
   * Adds a notification warning
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationWarning(messageKey: string, params: unknown[] = []): void {
    // Redirect
    this.#addNotification('warning', messageKey, params);
  }

  /**
   * Adds a notification error
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   */
  addNotificationError(messageKey: string, params: unknown[] = []): void {
    // Redirect
    this.#addNotification('error', messageKey, params);
  }

  // #endregion NOTIFICATIONS

  // #region MESSAGES

  /**
   * Reusable utility function to send event to display a message in the snackbar
   * @param {SnackbarType} type - The  type of snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Array of parameters to replace, i.e. ['short']
   * @param {ISnackbarButton} button - Optional snackbar button
   * @private
   */
  #showSnackbarMessage(type: SnackbarType, messageKey: string, params: unknown[], button?: ISnackbarButton): void {
    // Get the localized message
    const message = getLocalizedMessage(AppEventProcessor.getDisplayLanguage(this.mapId), messageKey, params);

    const snackbar: SnackBarOpenEvent = {
      snackbarType: type,
      message,
      button,
    };
    // Emit
    this.#emitSnackbarOpen(snackbar);
  }

  /**
   * Adds a snackbar message to the queue and displays it if it is the only one.
   * @param {SnackbarType} type - The  type of snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Indicates if the message has also been added as a notification
   * @param {ISnackbarButton} button - Optional snackbar button
   * @private
   */
  #addSnackbarMessage(
    type: SnackbarType,
    messageKey: string,
    params: unknown[],
    withNotification: boolean,
    button?: ISnackbarButton
  ): void {
    // If the snackbar message queue is already at four, push message to notifications, if it isn't there already
    if (this.snackbarMessageQueue.length > 4 && !withNotification) {
      if (type === 'error') this.addNotificationError(messageKey, params);
      else if (type === 'success') this.addNotificationSuccess(messageKey, params);
      else if (type === 'warning') this.addNotificationWarning(messageKey, params);
      else this.addNotificationMessage(messageKey, params);
    } else {
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
      this.snackbarMessageQueue.push({ type, messageKey, params, button });

      // Display the message if it is the only one
      if (this.snackbarMessageQueue.length === 1) this.displayNextSnackbarMessage();
    }
  }

  /**
   * Display next message in snackbar message queue, if there is one
   */
  displayNextSnackbarMessage(): void {
    if (this.snackbarMessageQueue.length) {
      const nextMessage = this.snackbarMessageQueue[0];
      this.#showSnackbarMessage(nextMessage.type, nextMessage.messageKey, nextMessage.params, nextMessage.button);
    }
  }

  /**
   * Displays a message in the snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showMessage(messageKey: string, params: unknown[] = [], withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#addSnackbarMessage('info', messageKey, params, withNotification, button);
    if (withNotification) this.addNotificationMessage(messageKey, params);
  }

  /**
   * Displays an success message in the snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showSuccess(messageKey: string, params: unknown[] = [], withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#addSnackbarMessage('success', messageKey, params, withNotification, button);
    if (withNotification) this.addNotificationSuccess(messageKey, params);
  }

  /**
   * Displays an warning message in the snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showWarning(messageKey: string, params: unknown[] = [], withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#addSnackbarMessage('warning', messageKey, params, withNotification, button);
    if (withNotification) this.addNotificationWarning(messageKey, params);
  }

  /**
   * Displays an error message in the snackbar
   * @param {string} messageKey - The message or a locale key to retrieve
   * @param {unknown[] | undefined} params - Optional, array of parameters to replace, i.e. ['short']
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showError(messageKey: string, params: unknown[] = [], withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#addSnackbarMessage('error', messageKey, params, withNotification, button);
    if (withNotification) this.addNotificationError(messageKey, params);
  }

  /**
   * Displays an error which can be a GeoViewError or a generic Error.
   * @param {Error | unknown} error - The error to retrieve the message from and translate it
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button - Optional snackbar button
   */
  showErrorFromError(error: Error | unknown, withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // If a GeoViewError, we know we have messageKeys for us as that's how we build our Errors
    if (error instanceof GeoViewError) {
      // Show the GeoViewError message
      this.showError(error.messageKey, error.messageParams, withNotification, button);
      return;
    }

    // Here it's either an Error System or unknown. If Error System, read the message.
    let message = error;
    if (error instanceof Error) {
      message = error.message;
    }

    // Log to the console (for devs)
    logger.logError(message);

    // Show a generic error, because the error systems aren't necessarily for user to see nor translated.
    this.showErrorGeneric(withNotification, button);
  }

  /**
   * Displays a generic error message in the snackbar
   * @param {boolean} withNotification - Optional, indicates if the message should also be added as a notification, default true
   */
  showErrorGeneric(withNotification: boolean = true, button: ISnackbarButton = {}): void {
    // Redirect
    this.#addSnackbarMessage('error', 'error.generic', [], withNotification, button);
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
    EventHelper.emitEvent(this, this.#onSnackbarOpenHandlers, event);
  }

  /**
   * Registers a snackbar open event handler.
   * @param {SnackBarOpenDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSnackbarOpenHandlers, callback);
  }

  /**
   * Unregisters a snackbar open event handler.
   * @param {SnackBarOpenDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offSnackbarOpen(callback: SnackBarOpenDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSnackbarOpenHandlers, callback);
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

export type SnackbarProps = {
  type: SnackbarType;
  messageKey: string;
  params: unknown[];
  button?: ISnackbarButton;
};
