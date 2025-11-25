import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { ClickAwayListener } from '@mui/material';
import { animated } from '@react-spring/web';
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
import { useShake } from '@/core/utils/useSpringAnimations';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { SxStyles } from '@/ui/style/types';

export type NotificationDetailsType = {
  key: string;
  notificationType: NotificationType;
  message: string;
  description?: string;
  count: number;
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// NotificationItem component
const NotificationItem = memo(function NotificationItem({
  notification,
  onRemove,
  theme,
  sxClasses,
  t,
}: {
  notification: NotificationDetailsType;
  onRemove: (key: string) => void;
  theme: Theme;
  sxClasses: SxStyles;
  t: (key: string) => string;
}) {
  const handleRemove = useCallback(() => {
    logger.logTraceUseCallback('NOTIFICATION - remove', notification.key);
    onRemove(notification.key);
  }, [notification.key, onRemove]);

  const icon = (() => {
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
  })();

  return (
    <Box sx={sxClasses.notificationItem}>
      <Box>{icon}</Box>
      <Box
        sx={{
          flexGrow: 1,
          fontSize: theme.palette.geoViewFontSize.sm,
          color: theme.palette.geoViewColor.textColor.light[250],
        }}
      >
        <Box component="span">{notification.message}</Box>
      </Box>
      {notification.count > 1 && (
        <Box>
          <Box sx={sxClasses.notificationsCount}>{notification.count}</Box>
        </Box>
      )}
      <IconButton aria-label={t('general.close')} onClick={handleRemove}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
});

// NotificationHeader component
const NotificationHeader = memo(function NotificationHeader({
  onClose,
  onRemoveAll,
  hasNotifications,
  t,
  sxClasses,
}: {
  onClose: () => void;
  onRemoveAll: () => void;
  hasNotifications: boolean;

  t: (key: string) => string;
  sxClasses: SxStyles;
}) {
  return (
    <Box sx={sxClasses.notificationsHeader}>
      <Typography component="h3" sx={sxClasses.notificationsTitle}>
        {t('appbar.notifications')}
      </Typography>
      <Box>
        <Button
          type="text"
          variant="contained"
          disabled={!hasNotifications}
          size="small"
          onClick={onRemoveAll}
          aria-label={t('appbar.removeAllNotifications')}
        >
          {t('appbar.removeAllNotifications')}
        </Button>
        <IconButton aria-label={t('general.close')} sx={{ ml: '0.25rem' }} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

/**
 * Notification main component
 *
 * @returns {JSX.Element} the notification component
 */
export default memo(function Notifications(): JSX.Element {
  logger.logTraceRender('components/notifications/notifications');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Store
  const notifications = useAppNotifications();
  const interaction = useMapInteraction();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { removeNotification, removeAllNotifications } = useAppStoreActions();

  // Get container
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Animation
  const shakeAnimation = useShake();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const AnimatedSpan = animated('span');

  // Handlers
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    logger.logTraceUseCallback('NOTIFICATION - open');
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  }, []);

  const handleClickAway = useCallback(() => {
    logger.logTraceUseCallback('NOTIFICATION - close');
    if (open) setOpen(false);
  }, [open]);

  const handleRemoveNotification = useCallback(
    (key: string) => {
      removeNotification(key);
    },
    [removeNotification]
  );

  // Effects
  useEffect(() => {
    if (open) {
      // When panel open, remove the notification count on the popover. On new notification, it will continue to
      // increment notification from those inside the popover
      setNotificationsCount(0);
    }
  }, [open]);

  useEffect(() => {
    logger.logTraceUseEffect('Notifications - notifications list changed', notificationsCount, notifications);

    const curNotificationCount = _.sumBy(notifications, (n) => n.count);
    if (curNotificationCount > notificationsCount) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setHasNewNotification(true);

      timerRef.current = setTimeout(() => {
        setHasNewNotification(false);
        timerRef.current = undefined;
      }, 1000);
    }

    setNotificationsCount(curNotificationCount);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]); // Only depend on notifications changes

  // Memoized notification list
  const notificationsList = useMemo(
    () =>
      notifications.map((notification) => (
        <NotificationItem
          key={notification.key}
          notification={notification}
          onRemove={handleRemoveNotification}
          theme={theme}
          sxClasses={sxClasses}
          t={t}
        />
      )),
    [notifications, handleRemoveNotification, theme, sxClasses, t]
  );

  // TODO: WCAG Issue #3154 - add aria-controls to notifications <IconButton>. Needs id of the modal to be passed as a prop.
  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={{ padding: interaction === 'dynamic' ? 'none' : '5px' }}>
        <IconButton
          id="notification"
          aria-label={t('appbar.notifications')}
          aria-expanded={open}
          tooltipPlacement="right"
          onClick={handleOpenPopover}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
          color="primary"
        >
          <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
            <AnimatedSpan
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                ...(hasNewNotification ? shakeAnimation : {}),
              }}
            >
              {hasNewNotification ? <NotificationsActiveIcon /> : <NotificationsIcon />}
            </AnimatedSpan>
          </Badge>
        </IconButton>

        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="right-end"
          onClose={handleClickAway}
          container={mapElem}
          focusSelector="h3 + div button:last-child"
          focusTrap={activeTrapGeoView}
          modifiers={[
            {
              name: 'eventListeners',
              options: { scroll: false, resize: true },
            },
          ]}
          sx={{
            position: 'fixed',
            pointerEvents: 'auto',
            zIndex: theme.zIndex.modal + 100,
          }}
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
        >
          <Paper sx={sxClasses.notificationPanel}>
            <NotificationHeader
              onClose={handleClickAway}
              onRemoveAll={removeAllNotifications}
              hasNotifications={notifications.length > 0}
              t={t}
              sxClasses={sxClasses}
            />
            <Box sx={sxClasses.notificationsList}>
              {notifications.length > 0 ? (
                notificationsList
              ) : (
                <Typography component="div" sx={{ padding: '10px 15px' }}>
                  {t('appbar.noNotificationsAvailable')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
