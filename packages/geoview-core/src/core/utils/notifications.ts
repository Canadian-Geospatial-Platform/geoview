import { ISnackbarButton, SnackbarType } from '@/api/events/payloads/snackbar-message-payload';
import { NotificationType } from '@/core/components/notifications/notifications';
import { generateId } from './utilities';
import { api } from '@/app';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

export class Notifications {
  mapId;

  constructor(mapId: string) {
    this.mapId = mapId;
  }

  // #region NOTIFICATION MESSAGES
  /**
   * Reusable utility function to send event to add a notification in the notifications manager
   *
   * @param {NotificationType} type optional, the type of message (info, success, warning, error), info by default
   * @param {string} message optional, the message string
   */
  // eslint-disable-next-line no-underscore-dangle, default-param-last
  #addNotification(type: NotificationType = 'info', message: string): void {
    const notification = {
      key: generateId(),
      notificationType: type,
      message,
      count: 1,
    };

    AppEventProcessor.addAppNotification(this.mapId, notification);
  }

  /**
   * Add a notification message
   *
   * @param {string} message the message string
   */
  addNotificationMessage(message: string): void {
    // Redirect
    this.#addNotification('info', message);
  }

  /**
   * Add a notification success
   *
   * @param {string} message the message string
   */
  addNotificationSuccess(message: string): void {
    // Redirect
    this.#addNotification('success', message);
  }

  /**
   * Add a notification warning
   *
   * @param {string} message the message string
   */
  addNotificationWarning(message: string): void {
    // Redirect
    this.#addNotification('warning', message);
  }

  /**
   * Add a notification error
   *
   * @param {string} message the message string
   */
  addNotificationError(message: string): void {
    // Redirect
    this.#addNotification('error', message);
  }

  /**
   * Reusable utility function to send event to display a message in the snackbar
   *
   * @param {SnackbarType} snackbarType the  type of snackbar
   * @param {string} message the snackbar message
   * @param {ISnackbarButton} button optional snackbar button
   */
  // eslint-disable-next-line no-underscore-dangle
  #showSnackbarMessage(type: SnackbarType, message: string, button?: ISnackbarButton): void {
    // Emit
    api.event.emitSnackbarOpen(this.mapId, type, message, button);
  }

  /**
   * Display a message in the snackbar
   *
   * @param {string} message the message string
   * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button optional snackbar button
   */
  showMessage(message: string, withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('info', message, button);
    if (withNotification) this.addNotificationMessage(message);
  }

  /**
   * Display an success message in the snackbar
   *
   * @param {string} message the message string
   * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button optional snackbar button
   */
  showSuccess(message: string, withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('success', message, button);
    if (withNotification) this.addNotificationSuccess(message);
  }

  /**
   * Display an warning message in the snackbar
   *
   * @param {string} message the message string
   * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button optional snackbar button
   */
  showWarning(message: string, withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('warning', message, button);
    if (withNotification) this.addNotificationWarning(message);
  }

  /**
   * Display an error message in the snackbar
   *
   * @param {string} message the message string
   * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
   * @param {ISnackbarButton} button optional snackbar button
   */
  showError(message: string, withNotification = true, button = {}): void {
    // Redirect
    this.#showSnackbarMessage('error', message, button);
    if (withNotification) this.addNotificationError(message);
  }
  // #endregion NOTIFICATION MESSAGES
}
