import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import _ from 'lodash';
import { ClickAwayListener } from '@mui/material';
import {
  Box,
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
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';

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
  const [open, setOpen] = useState(false);

  // get values from the store
  const notifications = useAppNotifications();
  const interaction = useMapInteraction();
  const { removeNotification } = useAppStoreActions();
  const notificationsCount = _.sumBy(notifications, (n) => n.count);

  // handle open/close
  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleClickAway = (): void => {
    if (open) {
      setOpen(false);
    }
  };

  /**
   * Remove a notification
   */
  const handleRemoveNotificationClick = (notification: NotificationDetailsType): void => {
    removeNotification(notification.key);
  };

  function getNotificationIcon(notification: NotificationDetailsType): JSX.Element {
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

  function renderNotification(notification: NotificationDetailsType, index: number): JSX.Element {
    return (
      <Box sx={sxClasses.notificationItem} key={index}>
        <Box>{getNotificationIcon(notification)}</Box>
        <Box sx={{ flexGrow: 1, fontSize: theme.palette.geoViewFontSize.sm, color: theme.palette.geoViewColor.textColor.light[250] }}>
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
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <div>
        <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
          <IconButton
            id="notification"
            tooltip="appbar.notifications"
            tooltipPlacement="bottom-end"
            onClick={handleOpenPopover}
            className={`${interaction === 'dynamic' ? 'style3' : 'style4'} ${open ? 'active' : ''}`}
            color="primary"
          >
            <NotificationsIcon />
          </IconButton>
        </Badge>

        <Popper open={open} anchorEl={anchorEl} placement="right-end" onClose={handleClickAway} container={mapElem}>
          <Paper sx={sxClasses.notificationPanel}>
            <Typography component="h3" sx={sxClasses.notificationsTitle}>
              {t('appbar.notifications')}
            </Typography>
            <Box sx={sxClasses.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => renderNotification(notification, index))
              ) : (
                <Typography component="div" sx={{ padding: '10px 15px' }}>
                  {t('appbar.no_notifications_available')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Popper>
      </div>
    </ClickAwayListener>
  );
}
