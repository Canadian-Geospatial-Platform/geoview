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
  DeleteIcon,
  IconButton,
  NotificationsIcon,
  NotificationsActiveIcon,
  Badge,
  Typography,
  Popper,
  Paper,
  Button,
  List,
  Link,
} from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreAppNotifications } from '@/core/stores/states/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreMapInteraction } from '@/core/stores/states/map-state';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
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
const NotificationItem = memo(
  ({
    notification,
    onRemove,
    sxClasses,
    t,
    closeButtonRef,
  }: {
    /** The notification details to display. */
    notification: NotificationDetailsType;
    /** Callback to remove a notification by key. */
    onRemove: (key: string) => void;
    /** The sx classes object. */
    sxClasses: SxStyles;
    /** The translation function. */
    t: (key: string, options?: Record<string, unknown>) => string;
    /** Ref to the close button for focus management. */
    closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  }): JSX.Element => {
    // Log
    logger.logTraceRender('components/notifications/notifications > NotificationItem');

    // #region Handlers

    /**
     * Handles when the user clicks the remove button for this notification.
     */
    const handleRemove = useCallback((): void => {
      onRemove(notification.key);
      // Move focus to close button after removal to prevent focus loss
      closeButtonRef.current?.focus();
    }, [notification.key, onRemove, closeButtonRef]);

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
          tooltip={t('general.remove')}
          aria-label={t('appbar.removeNotification')}
          aria-describedby={notification.key}
          size="small"
          onClick={handleRemove}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  }
);
NotificationItem.displayName = 'NotificationItem';

/**
 * Renders the notification panel header with title and close button.
 *
 * Memoized to avoid re-rendering when notification list changes but header props remain the same.
 *
 * @param props - The notification header properties
 * @returns The notification header element
 */
const NotificationHeader = memo(
  ({
    onClose,
    t,
    sxClasses,
    titleId,
    closeButtonId,
    closeButtonRef,
  }: {
    /** Callback to close the notification panel. */
    onClose: () => void;
    /** The translation function. */
    t: (key: string) => string;
    /** The sx classes object. */
    sxClasses: SxStyles;
    /** The dialog title element ID. */
    titleId: string;
    /** The close button element ID. */
    closeButtonId: string;
    /** Ref to the close button for focus management. */
    closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  }): JSX.Element => {
    // Log
    logger.logTraceRender('components/notifications/notifications > NotificationHeader');

    return (
      <Box component="header" sx={sxClasses.notificationsHeader}>
        <Typography component="h2" sx={sxClasses.notificationsTitle} id={titleId}>
          {t('appbar.notifications')}
        </Typography>
        <IconButton
          sx={sxClasses.notificationsCloseButton}
          className="buttonPopperClose"
          id={closeButtonId}
          iconRef={closeButtonRef}
          tooltip={t('general.close')}
          size="small"
          onClick={onClose}
          aria-label={t('appbar.closeNotificationsDialog')}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }
);
NotificationHeader.displayName = 'NotificationHeader';

/**
 * Renders the notification panel footer with remove all button.
 *
 * Memoized to avoid re-rendering when notification list changes but footer props remain the same.
 *
 * @param props - The notification footer properties
 * @returns The notification footer element
 */
const NotificationFooter = memo(
  ({
    onRemoveAll,
    hasNotifications,
    t,
    sxClasses,
    removeAllButtonId,
    removeAllButtonRef,
  }: {
    /** Callback to remove all notifications. */
    onRemoveAll: () => void;
    /** Whether there are any notifications. */
    hasNotifications: boolean;
    /** The translation function. */
    t: (key: string) => string;
    /** The sx classes object. */
    sxClasses: SxStyles;
    /** The ID for the remove all button. */
    removeAllButtonId: string;
    /** Ref to the remove all button for focus management. */
    removeAllButtonRef: React.RefObject<HTMLButtonElement | null>;
  }): JSX.Element => {
    // Log
    logger.logTraceRender('components/notifications/notifications > NotificationFooter');

    return (
      <Box component="footer" sx={sxClasses.notificationsFooter}>
        <Button
          id={removeAllButtonId}
          ref={removeAllButtonRef}
          type="text"
          variant="outlined"
          disabled={!hasNotifications}
          size="small"
          onClick={onRemoveAll}
          aria-label={t('appbar.removeAllNotifications')}
        >
          {t('general.removeAll')}
        </Button>
      </Box>
    );
  }
);
NotificationFooter.displayName = 'NotificationFooter';

/**
 * Renders the notification panel with a badge, popover, and notification list.
 *
 * Memoized to prevent re-renders triggered by parent updates when the component has no props.
 *
 * @returns The notification component
 */
const Notifications = memo((): JSX.Element => {
  logger.logTraceRender('components/notifications/notifications');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();

  /**
   * Builds custom sx classes for the notifications component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('NOTIFICATIONS - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Refs
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const removeAllButtonRef = useRef<HTMLButtonElement>(null);

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
  const removeAllButtonId = `${mapId}-notification-remove-all-button`;

  // Animation
  const shakeAnimation = useShake();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
    closeButtonRef.current?.focus();
  }, [uiController]);

  /**
   * Handles skip link click to focus the remove all button.
   *
   * Prevents default scroll behavior but manually updates the URL fragment for
   * assistive technology support while programmatically managing focus.
   */
  const handleSkipToFooter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      // Manually update URL fragment for AT without triggering scroll
      window.history.replaceState(null, '', `#${removeAllButtonId}`);
      removeAllButtonRef.current?.focus();
    },
    [removeAllButtonId]
  );

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
        closeButtonRef={closeButtonRef}
      />
    ));
  }, [notifications, handleRemoveNotification, memoSxClasses, t]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={{ padding: interaction === 'dynamic' ? 'none' : '5px' }}>
        <IconButton
          id={bellButtonId}
          iconRef={bellButtonRef}
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
          strategy="fixed"
          onClose={handleClickAway}
          container={mapElem}
          focusSelector={`#${closeButtonId}`}
          focusTrap={activeTrapGeoView}
          modifiers={[
            {
              name: 'eventListeners',
              options: { scroll: false, resize: true },
            },
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          sx={memoSxClasses.popper}
          handleKeyDown={handleEscapeKey}
        >
          <Paper component="section" sx={memoSxClasses.popoverPaper}>
            <NotificationHeader
              onClose={handleClickAway}
              t={t}
              sxClasses={memoSxClasses}
              titleId={titleId}
              closeButtonId={closeButtonId}
              closeButtonRef={closeButtonRef}
            />
            {notifications.length > 0 && (
              <Link href={`#${removeAllButtonId}`} tabIndex={0} sx={memoSxClasses.skipLink} onClick={handleSkipToFooter}>
                {t('keyboardnav.skipToFooter')}
              </Link>
            )}
            {notifications.length > 0 ? (
              <List sx={memoSxClasses.notificationsList} aria-live="polite" aria-relevant="all">
                {memoNotificationsList}
              </List>
            ) : (
              <Typography component="p" sx={memoSxClasses.emptyMessage} aria-live="polite">
                {t('appbar.noNotificationsAvailable')}
              </Typography>
            )}
            <NotificationFooter
              onRemoveAll={handleRemoveAllNotifications}
              hasNotifications={notifications.length > 0}
              t={t}
              sxClasses={memoSxClasses}
              removeAllButtonId={removeAllButtonId}
              removeAllButtonRef={removeAllButtonRef}
            />
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
Notifications.displayName = 'Notifications';
export default Notifications;
