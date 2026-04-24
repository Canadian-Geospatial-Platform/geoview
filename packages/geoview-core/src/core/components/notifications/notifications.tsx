import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

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
  List,
} from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreAppNotifications } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { CONTAINER_TYPE, TIMEOUT } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useShake } from '@/core/utils/useSpringAnimations';
import { getSxClasses } from './notifications-style';

/** Details for a single notification entry. */
export type NotificationDetailsType = {
  /** The unique key for the notification. */
  key: string;
  /** The type of notification. */
  notificationType: NotificationType;
  /** The notification message text. */
  message: string;
  /** Optional extended description. */
  description?: string;
  /** The number of times this notification has occurred. */
  count: number;
};

/** The type of notification severity. */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Renders a single notification list item with an icon, message, and remove button.
 *
 * Memoized to avoid re-rendering all items when only one notification changes.
 *
 * @param props - The notification item properties
 * @returns The notification item element
 */
const NotificationItem = memo(function NotificationItem({
  notification,
  onRemove,
  sxClasses,
  t,
  closeButtonId,
}: {
  /** The notification details to display. */
  notification: NotificationDetailsType;
  /** Callback to remove a notification by key. */
  onRemove: (key: string) => void;
  /** The sx classes object. */
  sxClasses: SxStyles;
  /** The translation function. */
  t: (key: string, options?: Record<string, unknown>) => string;
  /** The close button element ID for focus management. */
  closeButtonId: string;
}): JSX.Element {
  // #region Handlers

  /**
   * Handles when the user clicks the remove button for this notification.
   */
  const handleRemove = useCallback((): void => {
    onRemove(notification.key);
    // Move focus to close button after removal to prevent focus loss
    const closeButton = document.getElementById(closeButtonId);
    if (closeButton) {
      closeButton.focus();
    }
  }, [notification.key, onRemove, closeButtonId]);

  // #endregion Handlers

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
    <Box sx={sxClasses.notificationItem} component="li">
      {icon}
      <Box component="p" id={notification.key} sx={sxClasses.notificationsItemMsg}>
        {/* WCAG - Add visually hidden severity text for screen readers */}
        <Box component="span" sx={visuallyHidden}>
          {t(`general.notificationType.${notification.notificationType}`)}:{' '}
        </Box>
        {notification.message}
        {notification.count > 1 && (
          <Box component="span" aria-label={t('appbar.repeatedNotificationTimes', { count: notification.count })}>
            {notification.count}
          </Box>
        )}
      </Box>
      <IconButton
        className="buttonOutline"
        tooltip={t('general.remove')}
        aria-label={t('appbar.removeNotification')}
        aria-describedby={notification.key}
        size="small"
        onClick={handleRemove}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
});

/**
 * Renders the notification panel header with title, remove all, and close buttons.
 *
 * Memoized to avoid re-rendering when notification list changes but header props remain the same.
 *
 * @param props - The notification header properties
 * @returns The notification header element
 */
const NotificationHeader = memo(function NotificationHeader({
  onClose,
  onRemoveAll,
  hasNotifications,
  t,
  sxClasses,
  titleId,
  closeButtonId,
}: {
  /** Callback to close the notification panel. */
  onClose: () => void;
  /** Callback to remove all notifications. */
  onRemoveAll: () => void;
  /** Whether there are any notifications. */
  hasNotifications: boolean;
  /** The translation function. */
  t: (key: string) => string;
  /** The sx classes object. */
  sxClasses: SxStyles;
  /** The dialog title element ID. */
  titleId: string;
  /** The close button element ID. */
  closeButtonId: string;
}): JSX.Element {
  return (
    <Box component="header" sx={sxClasses.notificationsHeader}>
      <Typography component="h2" sx={sxClasses.notificationsTitle} id={titleId}>
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
          {t('general.removeAll')}
        </Button>
        <IconButton
          className="buttonOutline"
          id={closeButtonId}
          tooltip={t('general.close')}
          size="small"
          sx={{ ml: '0.25rem' }}
          onClick={onClose}
          aria-label={t('appbar.closeNotificationsDialog')}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

/**
 * Renders the notification panel with a badge, popover, and notification list.
 *
 * Memoized to prevent re-renders triggered by parent updates when the component has no props.
 *
 * @returns The notification component
 */
export default memo(function Notifications(): JSX.Element {
  logger.logTraceRender('components/notifications/notifications');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('NOTIFICATIONS - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Ref to read the latest notificationsCount inside the notifications effect without making it a dep
  const notificationsCountRef = useRef(notificationsCount);
  notificationsCountRef.current = notificationsCount;

  // Store
  const notifications = useStoreAppNotifications();
  const interaction = useStoreMapInteraction();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const uiController = useUIController();

  // Get container
  const mapId = useStoreGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Element IDs for accessibility and focus management
  const dialogId = `${mapId}-notification-dialog`;
  const titleId = `${mapId}-notification-title`;
  const closeButtonId = `${mapId}-notification-close-button`;
  const bellButtonId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-notifications-btn`;

  // Animation
  const shakeAnimation = useShake();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const AnimatedSpan = animated('span');

  // #region Handlers

  /**
   * Handles when the user clicks the notification bell button.
   */
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  }, []);

  /**
   * Handles when the user clicks away from the notification popover.
   */
  const handleClickAway = useCallback((): void => {
    if (open) setOpen(false);
  }, [open]);

  /**
   * Removes a single notification.
   *
   * @param key - The notification key to remove
   */
  const handleRemoveNotification = useCallback(
    (key: string): void => {
      uiController.removeNotification(key);
    },
    [uiController]
  );

  /**
   * Handles when the user removes all notifications.
   */
  const handleRemoveAllNotifications = useCallback((): void => {
    uiController.removeAllNotifications();
    // Move focus to close button after removal to prevent focus loss
    const closeButton = document.getElementById(closeButtonId);
    if (closeButton) {
      closeButton.focus();
    }
  }, [uiController, closeButtonId]);

  // #endregion Handlers

  // Effects
  /**
   * Resets the notification count when the popover opens.
   */
  useEffect(() => {
    logger.logTraceUseEffect('NOTIFICATIONS - popover open state sync', open);

    if (open) {
      // When panel open, remove the notification count on the popover. On new notification, it will continue to
      // increment notification from those inside the popover
      setNotificationsCount(0);
    }
  }, [open]);

  /**
   * Triggers the shake animation when new notifications arrive.
   */
  useEffect(() => {
    logger.logTraceUseEffect('Notifications - notifications list changed', notifications);

    const curNotificationCount = notifications.reduce((sum, n) => sum + n.count, 0);
    if (curNotificationCount > notificationsCountRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setHasNewNotification(true);

      timerRef.current = setTimeout(() => {
        setHasNewNotification(false);
        timerRef.current = undefined;
      }, TIMEOUT.notification);
    }

    setNotificationsCount(curNotificationCount);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notifications]);

  /**
   * Builds the rendered list of notification items.
   */
  const memoNotificationsList = useMemo((): JSX.Element[] => {
    logger.logTraceUseMemo('NOTIFICATIONS - memoNotificationsList', notifications);

    return notifications.map((notification) => (
      <NotificationItem
        key={notification.key}
        notification={notification}
        onRemove={handleRemoveNotification}
        sxClasses={memoSxClasses}
        t={t}
        closeButtonId={closeButtonId}
      />
    ));
  }, [notifications, handleRemoveNotification, memoSxClasses, t, closeButtonId]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={{ padding: interaction === 'dynamic' ? 'none' : '5px' }}>
        <IconButton
          id={bellButtonId}
          tooltipPlacement="right"
          onClick={handleOpenPopover}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
          color="primary"
          aria-label={
            notificationsCount > 0 ? t('appbar.notificationsWithCount', { count: notificationsCount }) : t('appbar.notifications')
          }
          aria-haspopup="dialog"
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
          role="dialog"
          id={dialogId}
          aria-labelledby={titleId}
          aria-modal="true"
          open={open}
          anchorEl={anchorEl}
          placement="right-end"
          onClose={handleClickAway}
          container={mapElem}
          focusSelector={`#${closeButtonId}`}
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
          <Paper component="section" sx={memoSxClasses.notificationPanel}>
            <NotificationHeader
              onClose={handleClickAway}
              onRemoveAll={handleRemoveAllNotifications}
              hasNotifications={notifications.length > 0}
              t={t}
              sxClasses={memoSxClasses}
              titleId={titleId}
              closeButtonId={closeButtonId}
            />
            <List sx={memoSxClasses.notificationsList} aria-live="polite" aria-relevant="all">
              {notifications.length > 0 ? (
                memoNotificationsList
              ) : (
                <Typography component="p" sx={{ padding: '10px 0' }}>
                  {t('appbar.noNotificationsAvailable')}
                </Typography>
              )}
            </List>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
