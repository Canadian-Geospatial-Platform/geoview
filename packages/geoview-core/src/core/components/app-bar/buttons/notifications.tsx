import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { MapContext } from '@/core/app-start';
import { api } from '@/app';

import { EVENT_NAMES } from '@/api/events/event-types';
import {
  notificationPayload,
  NotificationPayload,
  payloadIsANotification,
  NotificationType,
} from '@/api/events/payloads/notification-payload';

import { Box, Popover, InfoIcon, ErrorIcon, WarningIcon, CheckCircleIcon, CloseIcon, IconButton, NotificationsIcon, Badge } from '@/ui';

type NotificationDetailsType = {
  notificationType: NotificationType;
  message: string;
  description?: string;
};

/**
 * Notification PNG Button component
 *
 * @returns {JSX.Element} the notification button
 */
export default function Notifications(): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notificationsList, setNotificationsList] = useState<NotificationDetailsType[]>([]);
  const notificationsListRef = useRef<NotificationDetailsType[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const notificationsCountRef = useRef<number>(0);

  const { t } = useTranslation<string>();

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  /**
   * Add a notification
   */
  const addNotification = useCallback((payload: NotificationPayload) => {
    // push the notification to the end of the list
    const toAdd = payload as NotificationDetailsType;
    notificationsListRef.current.push(toAdd);
    setNotificationsList(notificationsListRef.current);
    notificationsCountRef.current += 1;
    setNotificationsCount(notificationsCountRef.current);
  }, []);

  /**
   * Remove a notification
   */
  const removeNotification = useCallback((payload: NotificationDetailsType) => {
    const state = [...notificationsListRef.current];
    const index = state.findIndex((notif) => notif.message === payload.message && payload.notificationType === notif.notificationType);
    if (index > -1) {
      state.splice(index, 1);
      notificationsListRef.current = state;
      setNotificationsList(notificationsListRef.current);
      notificationsCountRef.current -= 1;
      setNotificationsCount(notificationsCountRef.current);
    }
  }, []);

  const handleRemoveNotificationClick = (payload: NotificationDetailsType) => {
    const state = [...notificationsListRef.current];
    const index = state.findIndex((notif) => notif.message === payload.message && payload.notificationType === notif.notificationType);
    if (index > -1) {
      api.event.emit(
        notificationPayload(
          EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_REMOVE,
          mapId,
          payload.notificationType,
          payload.message,
          payload.description
        )
      );
    }
  };

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
  }, [mapId]);

  function getNotificationIcon(notification: NotificationDetailsType) {
    switch (notification.notificationType) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <ErrorIcon color="error" />;
    }
  }

  function renderNotification(notification: NotificationDetailsType, index: number) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', borderBottom: '1px solid #474747' }} key={index}>
        <div>{getNotificationIcon(notification)}</div>
        <Box sx={{ flexGrow: 1 }}>{notification.message}</Box>
        <IconButton onClick={() => handleRemoveNotificationClick(notification)}>
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }

  const open = Boolean(anchorEl);

  return (
    <>
      <Badge badgeContent={notificationsCount} color="error">
        <IconButton
          id="notification"
          tooltip="appbar.notifications"
          tooltipPlacement="bottom-end"
          onClick={handleOpenPopover}
          className={open ? 'active' : ''}
        >
          <NotificationsIcon />
        </IconButton>
      </Badge>

      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={handleClosePopover}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 20px',
            width: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            gap: '8px',
          }}
        >
          <Typography component="div">{t('appbar.notifications')}</Typography>
          <Typography component="div">
            <hr />
          </Typography>
          {notificationsList.length > 0 ? (
            notificationsList.map((details, index) => renderNotification(details, index))
          ) : (
            <Typography component="div">{t('appbar.no_notifications_available')}</Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}
