import { useCallback, useContext, useEffect, useState, MouseEventHandler, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { notificationPayload, NotificationPayload, payloadIsANotification } from '../../../api/events/payloads/notification-payload';

import { Box, Popover, InfoIcon, ErrorIcon, WarningIcon, CheckCircleIcon, CloseIcon, IconButton } from '../../../ui';
import { NotificationDetailsType } from './notifications-api';

interface NotificationPopoverProps {
  anchorEl: HTMLElement | null;
  handleClose: MouseEventHandler;
}

/**
 * The NotificationPopover component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function NotificationsPopover(props: NotificationPopoverProps): JSX.Element | null {
  const [activeNotifications, setActiveNotifications] = useState<NotificationDetailsType[]>([]);
  const notifsListRef = useRef<NotificationDetailsType[]>([]);
  const { t } = useTranslation<string>();

  const { anchorEl, handleClose } = props;

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Add a notification
   */
  const addNotification = useCallback((payload: NotificationPayload) => {
    // push the notification to the end of the list
    const toAdd = payload as NotificationDetailsType;
    notifsListRef.current.push(toAdd);
    setActiveNotifications(notifsListRef.current);
  }, []);

  /**
   * Remove a notification
   */
  const removeNotification = useCallback((payload: NotificationDetailsType) => {
    const state = [...notifsListRef.current];
    const index = state.findIndex((notif) => notif.message === payload.message && payload.notificationType === notif.notificationType);
    if (index > -1) {
      state.splice(index, 1);
      notifsListRef.current = state;
      setActiveNotifications(notifsListRef.current);
    }
  }, []);

  const handleRemoveNotificationClick = (payload: NotificationDetailsType) => {
    const state = [...notifsListRef.current];
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
  }, [addNotification, removeNotification, mapId]);

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
      onClose={handleClose}
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
        {activeNotifications.length > 0 ? (
          activeNotifications.map((details, index) => renderNotification(details, index))
        ) : (
          <Typography component="div">{t('appbar.no_notifications_available')}</Typography>
        )}
      </Box>
    </Popover>
  );
}
