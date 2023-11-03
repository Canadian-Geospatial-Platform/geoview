import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NotificationType } from '@/api/events/payloads';
import {
  Box,
  Popover,
  InfoIcon,
  ErrorIcon,
  WarningIcon,
  CheckCircleIcon,
  CloseIcon,
  IconButton,
  NotificationsIcon,
  Badge,
  Typography,
} from '@/ui';
import { sxClasses } from './notifications-style';
import { useAppNotifications, useAppStoreActions } from '@/core/stores/app-state';

export type NotificationDetailsType = {
  key: string;
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
  const { t } = useTranslation<string>();

  // internal state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // get values from the store
  const notifications = useAppNotifications();
  const { removeNotification } = useAppStoreActions();
  const notificationsCount = notifications.length;

  // handle open/close
  const open = Boolean(anchorEl);
  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  /**
   * Remove a notification
   */
  const handleRemoveNotificationClick = (notification: NotificationDetailsType) => {
    removeNotification(notification.key);
  };

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
      <Box sx={sxClasses.notificationItem} key={index}>
        <Box>{getNotificationIcon(notification)}</Box>
        <Box sx={{ flexGrow: 1 }}>{notification.message}</Box>
        <IconButton onClick={() => handleRemoveNotificationClick(notification)}>
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }

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
        <Box sx={sxClasses.notificationPanel}>
          <Typography component="div">{t('appbar.notifications')}</Typography>
          <Typography component="div">
            <hr />
          </Typography>
          <Box sx={{ overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => renderNotification(notification, index))
            ) : (
              <Typography component="div">{t('appbar.no_notifications_available')}</Typography>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
