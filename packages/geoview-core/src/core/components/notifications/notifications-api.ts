import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { sanitizeHtmlContent } from '../../utils/utilities';

import { notificationPayload } from '../../../api/events/payloads/notification-payload';

type NotificationType = {
  message: string,
  description: string
}
/**
 * API to manage notifications in the notification component
 *
 * @exports
 * @class
 */
export class NotificationsApi {
  mapId!: string;

  // array that hold added tabs
  notificationsList: NotificationType[] = [];

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
   * @param {NotificationType} notificationProps the properties of the notification to be added
   *
   */
  addNotification = (notificationProps: NotificationType) => {
    if (notificationProps) {

      // add the new tab to the notifications array
      this.notificationsList.push(notificationProps);

      // trigger an event that a new tab has been created
      api.event.emit(notificationPayload(EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD, this.mapId, notificationProps));
    }
  };

  /**
   * Remove notification by index
   *
   * @param {number} index the index of the tab to be removed
   */
  removeNotification = (index: number): void => {
    // find the tab to be removed
    /*const tabToRemove = this.notificationsList.find((tab) => tab.value === value);

    if (tabToRemove) {
      // remove the tab from the notifications array
      this.notificationsList = this.notificationsList.filter((tab) => tab.value !== value);

      // trigger an event that a tab has been removed
      api.event.emit(notificationPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, this.mapId, tabToRemove));
    }*/
  };
}
