import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import _ from 'lodash';
import { ClickAwayListener } from '@mui/material';
import { animated, useSpring } from '@react-spring/web';
import {
  Box,
  InfoIcon,
  ErrorIcon,
  WarningIcon,
  CheckCircleIcon,
  CloseIcon,
  IconButton,
  NotificationsIcon,
  NotificationsActiveIcon,
  Badge,
  Typography,
  Popper,
  Paper,
  Button,
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
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [open, setOpen] = useState(false);

  // get values from the store
  const notifications = useAppNotifications();
  const interaction = useMapInteraction();
  const { removeNotification, removeAllNotifications } = useAppStoreActions();

  useEffect(() => {
    logger.logTraceUseEffect('Notifications - notifications list changed', notificationsCount, notifications);
    const curNotificationCount = _.sumBy(notifications, (n) => n.count);
    if (curNotificationCount > notificationsCount) {
      setHasNewNotification(true);
    }
    setNotificationsCount(curNotificationCount);
  }, [notifications, notificationsCount]);

  useEffect(() => {
    logger.logTraceUseEffect('Notifications - hasNewNotification change', hasNewNotification);
    if (hasNewNotification) {
      const timeoutId = setTimeout(() => setHasNewNotification(false), 1000); // Remove after 3 seconds
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [hasNewNotification, notificationsCount]);

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

  const shakeAnimation = useSpring({
    from: { x: 0, scale: 1 },
    to: async (next) => {
      await next({ x: 2 }); // Move 10px right and scale up 10%
      await next({ x: -2 }); // Move 10px left and scale down 10%
      await next({ x: 0 }); // Reset position and scale
    },
    config: { duration: 50 }, // Adjust duration for faster shake
    loop: true,
  });

  /**
   * Remove a notification
   */
  const handleRemoveNotificationClick = (notification: NotificationDetailsType): void => {
    removeNotification(notification.key);
  };

  const handleRemoveAllNotificationsClick = (): void => {
    removeAllNotifications();
  };

  const AnimatedBox = animated(Box);

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
          <Box component="span">{notification.message}</Box>
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
      <Box>
        <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
          <IconButton
            id="notification"
            tooltip="appbar.notifications"
            tooltipPlacement="bottom-end"
            onClick={handleOpenPopover}
            className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
            color="primary"
            sx={{ width: '2.375rem', height: '2.375rem' }}
          >
            {!hasNewNotification && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <NotificationsIcon />
              </Box>
            )}
            {hasNewNotification && (
              <AnimatedBox sx={{ display: 'inline-flex', alignItems: 'center' }} style={shakeAnimation}>
                <NotificationsActiveIcon />
              </AnimatedBox>
            )}
          </IconButton>
        </Badge>

        <Popper open={open} anchorEl={anchorEl} placement="right-end" onClose={handleClickAway} container={mapElem}>
          <Paper sx={sxClasses.notificationPanel}>
            <Box sx={sxClasses.notificationsHeader}>
              <Typography component="h3" sx={sxClasses.notificationsTitle}>
                {t('appbar.notifications')}
              </Typography>
              <Button
                type="text"
                variant="contained"
                disabled={notifications.length === 0}
                size="small"
                onClick={handleRemoveAllNotificationsClick}
              >
                {t('appbar.removeAllNotifications')}
              </Button>
            </Box>
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
      </Box>
    </ClickAwayListener>
  );
}
