import { api } from '@/app';

import { EVENT_NAMES } from '@/api/events/event-types';

import { notificationPayload, NotificationType } from '@/api/events/payloads';

export type NotificationDetailsType = {
  notificationType: NotificationType;
  message: string;
  description?: string;
};

/**
 * API to manage notifications in the notification component
 *
 * @exports
 * @class
 */
export class NotificationsApi {
  mapId!: string;

  // array that hold added tabs
  notificationsList: NotificationDetailsType[] = [];

  /**
   * initialize the notifications api
   *
   * @param mapId the id of the map this notifications belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a tab on the notifications
   *
   * @param {NotificationDetailsType} notificationProps the properties of the notification to be added
   *
   */
  addNotification = (notificationProps: NotificationDetailsType) => {
    if (notificationProps) {
      // add the new tab to the notifications array
      this.notificationsList.push(notificationProps);

      // trigger an event that a new tab has been created
      api.event.emit(
        notificationPayload(
          EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD,
          this.mapId,
          notificationProps.notificationType,
          notificationProps.message
        )
      );
    }
  };

  /**
   * Remove notification by index
   *
   * @param {NotificationDetailsType} notificationProps the properties of the notification to be removed
   */
  removeNotification = (notificationProps: NotificationDetailsType): void => {
    // find the notification to be removed
    const notifToRemove = this.notificationsList.find(
      (notif) => notif.message === notificationProps.message && notificationProps.notificationType === notif.notificationType
    );

    if (notifToRemove) {
      // remove the notification from the notifications array
      this.notificationsList = this.notificationsList.filter(
        (notif) => !(notif.message === notificationProps.message && notificationProps.notificationType === notif.notificationType)
      );

      // trigger an event that a notification has been removed
      api.event.emit(
        notificationPayload(
          EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_REMOVE,
          this.mapId,
          notificationProps.notificationType,
          notificationProps.message
        )
      );
    }
  };
}
