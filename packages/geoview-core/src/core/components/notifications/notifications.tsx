import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
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
  Popper,
  Paper,
} from '@/ui';
import { getSxClasses } from './notifications-style';
import { useAppNotifications, useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/app';
import { logger } from '@/core/utils/logger';
import _ from 'lodash';

export type NotificationDetailsType = {
  key: string;
  notificationType: NotificationType;
  message: string;
  description?: string;
  count: number;
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Notification PNG Button component
 *
 * @returns {JSX.Element} the notification button
 */
export default function Notifications(): JSX.Element {
  // Log
  logger.logTraceRender('components/notifications/notifications');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // internal state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // get values from the store
  const notifications = useAppNotifications();

  const { removeNotification } = useAppStoreActions();
  const notificationsCount = _.sumBy(notifications, (n) => n.count);

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
        <Box sx={{ flexGrow: 1, fontSize: '0.9em', color: theme.palette.geoViewColor.textColor.light[250] }}>
          <span>{notification.message}</span>
        </Box>
        {notification.count > 1 ? (
          <Box>
            <Box sx={sxClasses.notificationsCount}>{notification.count}</Box>
          </Box>
        ) : null}
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
          className={`style3 ${open ? 'active' : ''}`}
          color="primary"
        >
          <NotificationsIcon />
        </IconButton>
      </Badge>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement='right-end'
        container={mapElem}
      >
        <Paper sx={sxClasses.notificationPanel}>
          <Typography component="h3" sx={sxClasses.notificationsTitle}>{t('appbar.notifications')}</Typography>
          <Box sx={sxClasses.notificationsList}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => renderNotification(notification, index))
            ) : (
              <Typography component="div">{t('appbar.no_notifications_available')}</Typography>
            )}
          </Box>
        </Paper>
      </Popper>
    </>
  );
}
