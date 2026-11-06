import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useUIController } from '@/core/controllers/use-controllers';
import { useShellContainer } from '@/core/containers/shell-container-context';
import { useMapPopover } from '@/core/components/common/hooks/use-map-popover';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import {
  getStoreUIFocusItem,
  useStoreUIActiveFocusItem,
  useStoreUIActiveTrapGeoView,
  type FocusItemProps,
} from '@/core/stores/states/ui-state';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';
import { CloseIcon, SettingsIcon } from '@/ui/icons';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Paper } from '@/ui/paper/paper';
import { Popper } from '@/ui/popper/popper';
import { FocusTrap } from '@/ui/mui-reexports/mui-reexports';
import { Switch } from '@/ui/switch/switch';
import { Typography } from '@/ui/typography/typography';
import type { SxStyles } from '@/ui/style/types';

import { getSxClasses } from './settings-style';

/** Properties for the Settings button. */
export interface SettingsProps {
  /** Requests a coordinated change to the existing keyboard-navigation mode. */
  onKeyboardNavigationModeChange: (active: boolean) => void;
}

/**
 * Renders the persistent Settings button and its anchored, non-modal panel.
 *
 * @param props - The SettingsProps properties
 * @returns The Settings button and panel
 */
export function Settings(props: SettingsProps): JSX.Element {
  logger.logTraceRender('core/components/app-bar/buttons/settings');

  const { onKeyboardNavigationModeChange } = props;

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);
  const mapId = useStoreGeoViewMapId();
  const shellContainer = useShellContainer();
  const uiController = useUIController();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const focusItem = useStoreUIActiveFocusItem();
  const { open, anchorEl, openAt, close } = useMapPopover();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusItemRef = useRef<FocusItemProps | undefined>(undefined);
  const previousOpenRef = useRef(open);

  const buttonId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-settings-btn`;
  const panelId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-settings-panel`;
  const titleId = `${panelId}-title`;
  const switchId = `${panelId}-keyboard-navigation`;
  const settingsOwnerId = `${panelId}-focus`;

  // #region Handlers

  /**
   * Makes Settings the sole active inner focus owner without moving focus.
   */
  const claimFocusOwner = useCallback(
    (previousFocusItem?: FocusItemProps): void => {
      const currentFocusItem = getStoreUIFocusItem(mapId);
      if (currentFocusItem.activeElementId === settingsOwnerId) return;

      if (previousFocusItemRef.current === undefined) previousFocusItemRef.current = previousFocusItem ?? currentFocusItem;
      uiController.enableFocusTrap({
        activeElementId: settingsOwnerId,
        callbackElementId: buttonId,
        focusOnEntry: false,
      });
    },
    [buttonId, mapId, settingsOwnerId, uiController]
  );

  /**
   * Closes Settings and restores the previous owner only when Settings still owns focus.
   *
   * @param restoreTrigger - Whether an explicit keyboard dismissal should focus the trigger
   */
  const closePanel = useCallback(
    (restoreTrigger: boolean): void => {
      const currentFocusItem = getStoreUIFocusItem(mapId);
      const ownsFocus = currentFocusItem.activeElementId === settingsOwnerId;

      close();
      if (ownsFocus) {
        uiController.enableFocusTrap({
          ...(previousFocusItemRef.current ?? { activeElementId: false, callbackElementId: false }),
          focusOnEntry: false,
        });
      }
      previousFocusItemRef.current = undefined;

      if (restoreTrigger && (ownsFocus || !currentFocusItem.activeElementId)) triggerRef.current?.focus();
    },
    [close, mapId, settingsOwnerId, uiController]
  );

  /**
   * Opens Settings or explicitly closes it from its trigger.
   */
  const handleToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      if (open) {
        closePanel(true);
        return;
      }

      const previousFocusItem = openAt(event.currentTarget);
      if (activeTrapGeoView) claimFocusOwner(previousFocusItem);
    },
    [activeTrapGeoView, claimFocusOwner, closePanel, open, openAt]
  );

  /**
   * Closes Settings without overriding the pointer's focus destination.
   */
  const handleClickAway = useCallback((): void => {
    if (open) closePanel(false);
  }, [closePanel, open]);

  /**
   * Closes Settings and returns focus to its trigger.
   */
  const handleClose = useCallback((): void => {
    closePanel(true);
  }, [closePanel]);

  /**
   * Prevents Escape from dismissing an enclosing panel.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();
      closePanel(true);
    },
    [closePanel]
  );

  /**
   * Delegates the keyboard-navigation switch change to its lifecycle owner.
   */
  const handleModeChange = useCallback(
    (_event: ChangeEvent<HTMLInputElement>, active: boolean): void => {
      onKeyboardNavigationModeChange(active);
    },
    [onKeyboardNavigationModeChange]
  );

  // #endregion Handlers

  /**
   * Claims this panel when keyboard mode is enabled while Settings is already open.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SETTINGS - claim focus owner', activeTrapGeoView, open);
    if (open && activeTrapGeoView) claimFocusOwner();
  }, [activeTrapGeoView, claimFocusOwner, open]);

  /**
   * Yields to a superseding panel or modal without restoring stale ownership or focus.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SETTINGS - superseding focus owner', focusItem);
    if (!open || !focusItem.activeElementId || focusItem.activeElementId === settingsOwnerId) return;

    previousFocusItemRef.current = undefined;
    close();
  }, [close, focusItem, open, settingsOwnerId]);

  /**
   * Releases stale ownership when a controller closes this popover, such as Ctrl+M or Ctrl+Q.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SETTINGS - external popover close', open, activeTrapGeoView);
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (wasOpen && !open) {
      const currentFocusItem = getStoreUIFocusItem(mapId);
      if (currentFocusItem.activeElementId === settingsOwnerId) {
        if (activeTrapGeoView) {
          uiController.enableFocusTrap({
            ...(previousFocusItemRef.current ?? { activeElementId: false, callbackElementId: false }),
            focusOnEntry: false,
          });
        } else {
          uiController.disableFocusTrap('no-focus');
        }
      }
      previousFocusItemRef.current = undefined;
    }
  }, [activeTrapGeoView, mapId, open, settingsOwnerId, uiController]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          id={buttonId}
          iconRef={triggerRef}
          className={`buttonFilled ${open ? 'active' : ''}`}
          aria-label={t('appbar.settings')}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          tooltipPlacement="right"
          onClick={handleToggle}
        >
          <SettingsIcon />
        </IconButton>
        <Popper
          id={`${panelId}-popper`}
          role="presentation"
          open={open}
          anchorEl={anchorEl}
          container={shellContainer}
          placement="right-end"
          strategy="fixed"
          focusSelector={`#${switchId}`}
          sx={memoSxClasses.popper}
          modifiers={[
            { name: 'eventListeners', options: { scroll: false, resize: true } },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
          ]}
        >
          <FocusTrap
            open={open && activeTrapGeoView && focusItem.activeElementId === settingsOwnerId}
            disableEnforceFocus
            disableAutoFocus
            disableRestoreFocus
          >
            <Paper
              component="section"
              id={panelId}
              role="dialog"
              aria-labelledby={titleId}
              sx={memoSxClasses.panel}
              onKeyDown={handleKeyDown}
            >
              <Box component="header" sx={memoSxClasses.header}>
                <Typography component="h2" id={titleId} sx={memoSxClasses.title}>
                  {t('appbar.settings')}
                </Typography>
                <IconButton className="buttonPopperClose" size="small" aria-label={t('general.close')} onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={memoSxClasses.content}>
                <Switch id={switchId} label={t('appbar.keyboardNavigation')} checked={activeTrapGeoView} onChange={handleModeChange} />
              </Box>
            </Paper>
          </FocusTrap>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
