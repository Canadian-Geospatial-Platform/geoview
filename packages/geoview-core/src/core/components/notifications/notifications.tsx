import { useCallback, useContext, useEffect, useState } from 'react';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { NotificationPayload, payloadIsANotification } from '../../../api/events/payloads/notification-payload';

import { Box } from '../../../ui';
import { NotificationType } from './notifications-api';

const notificationsContainer = {
  flexDirection: 'column',
  justifyContent: 'flex-start',
};

/**
 * The FooterTabs component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function NotificationCenter(): JSX.Element | null {
  const [activeNotifications, setActiveNotifications] = useState<NotificationType[]>([]);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Add a notification
   */
  const addNotification = useCallback((payload: NotificationPayload) => {
    // push the tab to the end of the list
    console.log('payload-addNotifcation ', payload);
    // setActiveNotifications((prevArray) => [...prevArray, payload.tab as TypeTabs]);
  }, []);

  /**
   * Remove a notification
   */
  const removeNotification = useCallback(
    (payload: NotificationPayload) => {
      // remove the tab from the list
      console.log('payload-removeNotifcation ', payload);
      /* setActiveNotifications((prevState) => {
        const state = [...prevState];
        const index = state.findIndex((tab) => tab.value === payload.tab.value);
        if (index > -1) {
          state.splice(index, 1);
          return state;
        }
        return state;
      }); */
    },
    [setActiveNotifications]
  );

  /**
   * Manage the notifications 'add', 'remove'
   */
  useEffect(() => {
    // listen to new notification
    api.event.on(
      EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD,
      (payload) => {
        if (payloadIsANotification(payload)) addNotification(payload);
      },
      mapId
    );

    // listen on notification removal
    api.event.on(
      EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_REMOVE,
      (payload) => {
        if (payloadIsANotification(payload)) removeNotification(payload);
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD, mapId);
      api.event.off(EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_REMOVE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNotification, removeNotification, mapId]);

  function renderNotification(notification: NotificationType) {
    return <Box>{notification.message}</Box>;
  }

  return api.map(mapId).notifications.notificationsList.length > 0 ? (
    <Box sx={notificationsContainer}>{activeNotifications.map((details) => renderNotification(details))}</Box>
  ) : null;
}
