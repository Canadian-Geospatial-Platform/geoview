import { useCallback, useEffect, useMemo, useRef, useId } from 'react';
import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { ClickAwayListener } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './nav-bar-style';
import { Popper } from '@/ui/popper/popper';
import { IconButton } from '@/ui/icon-button/icon-button';
import { DialogTitle, DialogContent, Box } from '@/ui/layout';
import { Paper } from '@/ui/paper/paper';
import { CloseIcon } from '@/ui/icons';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import type { SxStyles } from '@/ui/style/types';

import { useShellContainer } from '@/core/containers/shell-container-context';
import { logger } from '@/core/utils/logger';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { useMapPopover } from '@/core/components/common/hooks/use-map-popover';
import { translateTooltip } from '@/core/utils/utilities';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import {
  getStoreUIFocusItem,
  useStoreUIActiveFocusItem,
  useStoreUIActiveTrapGeoView,
  type FocusItemProps,
} from '@/core/stores/states/ui-state';

/** The properties for the navbar panel button. */
interface NavbarPanelButtonType {
  /** The button panel configuration. */
  buttonPanel: TypeButtonPanel;
  /** Whether the button is in an active state. */
  isActive?: boolean;
  /** Whether to keep the panel mounted while closed so its state is preserved. */
  keepPanelMounted?: boolean;
  /** Accessible live-region content that must remain available when the panel is closed. */
  liveRegionContent?: ReactNode;
  /** Requests a change to the panel's open state. */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Creates a navbar button with a popover panel.
 *
 * @param props - The navbar panel button properties
 * @returns The navbar panel button component
 */
export default function NavbarPanelButton({
  buttonPanel,
  isActive = false,
  keepPanelMounted = false,
  liveRegionContent,
  onOpenChange,
}: NavbarPanelButtonType): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar-panel-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const baseId = useId();
  const dialogTitleId = `${baseId}-title`;

  // Store
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const focusItem = useStoreUIActiveFocusItem();
  const mapId = useStoreGeoViewMapId();
  const uiController = useUIController();
  const shellContainer = useShellContainer();

  // Extract panel width if provided
  const panelWidth = buttonPanel.panel?.width;

  /**
   * Builds custom sx classes for the navbar panel button.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('NAV-BAR-PANEL-BUTTON - memoSxClasses', theme, panelWidth);

    return getSxClasses(theme, panelWidth);
  }, [theme, panelWidth]);

  // States
  const { open, anchorEl, openAt, close: closePanel } = useMapPopover();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousRequestedOpen = useRef(false);
  const previousOpen = useRef(open);
  const previousOwnerOpen = useRef(open);
  const previousFocusItemRef = useRef<FocusItemProps | undefined>(undefined);
  const focusTrapId = `${mapId}-${buttonPanel.button.id}-navbar-focus-trap`;

  /**
   * Synchronizes externally requested panel visibility.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('NAV-BAR-PANEL-BUTTON - external open state', buttonPanel.panel?.status);
    const requestedOpen = buttonPanel.panel?.status ?? false;
    if (requestedOpen === previousRequestedOpen.current) return;
    previousRequestedOpen.current = requestedOpen;

    if (requestedOpen && buttonRef.current) {
      uiController.disableFocusTrap('no-focus');
      openAt(buttonRef.current);
    } else closePanel();
  }, [buttonPanel.panel?.status, closePanel, openAt, uiController]);

  /**
   * Notifies the caller when the panel open state changes.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('NAV-BAR-PANEL-BUTTON - open state callback', open);
    if (previousOpen.current === open) return;
    previousOpen.current = open;
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // #region Handlers

  /**
   * Closes the panel, optionally returning focus to its button.
   *
   * @param restoreTrigger - Whether this was an explicit keyboard dismissal
   */
  const closePanelWithFocus = useCallback(
    (restoreTrigger: boolean): void => {
      const currentFocusItem = getStoreUIFocusItem(mapId);
      if (currentFocusItem.activeElementId === focusTrapId) {
        uiController.enableFocusTrap({
          ...(previousFocusItemRef.current ?? { activeElementId: false, callbackElementId: false }),
          focusOnEntry: false,
        });
      }
      previousFocusItemRef.current = undefined;
      closePanel();
      if (restoreTrigger) buttonRef.current?.focus();
    },
    [closePanel, focusTrapId, mapId, uiController]
  );

  /**
   * Handles when the user clicks the navbar button to toggle the panel.
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      if (open) {
        closePanelWithFocus(true);
      } else {
        const previousFocusItem = openAt(event.currentTarget);
        if (activeTrapGeoView) previousFocusItemRef.current = previousFocusItem;
      }
    },
    [activeTrapGeoView, closePanelWithFocus, open, openAt]
  );

  /**
   * Handles when the user clicks away from the popover.
   */
  const handleClickAway = useCallback((): void => {
    if (open) {
      closePanelWithFocus(false);
    }
  }, [closePanelWithFocus, open]);

  /**
   * Handles Escape as an explicit keyboard dismissal.
   */
  const handleKeyDown = useCallback(
    (key: string): void => {
      if (key === 'Escape') closePanelWithFocus(true);
    },
    [closePanelWithFocus]
  );

  /**
   * Closes the panel from its header button and restores focus.
   */
  const handleClose = useCallback((): void => {
    closePanelWithFocus(true);
  }, [closePanelWithFocus]);

  // #endregion

  /**
   * Acquires unowned focus in keyboard mode and yields to newer owners or controller closure.
   */
  useEffect(() => {
    logger.logTraceUseEffect('NAV-BAR-PANEL-BUTTON - focus owner', open, activeTrapGeoView, focusItem.activeElementId);
    const currentFocusItem = getStoreUIFocusItem(mapId);
    if (open && currentFocusItem.activeElementId && currentFocusItem.activeElementId !== focusTrapId) {
      closePanelWithFocus(false);
    } else if (open && activeTrapGeoView && currentFocusItem.activeElementId !== focusTrapId) {
      if (previousFocusItemRef.current === undefined) previousFocusItemRef.current = currentFocusItem;
      uiController.enableFocusTrap({
        activeElementId: focusTrapId,
        callbackElementId: buttonPanel.button.id || false,
        focusOnEntry: false,
      });
    }

    const wasOpen = previousOwnerOpen.current;
    previousOwnerOpen.current = open;
    if (wasOpen && !open) closePanelWithFocus(false);
  }, [activeTrapGeoView, buttonPanel.button.id, closePanelWithFocus, focusItem.activeElementId, focusTrapId, mapId, open, uiController]);

  /**
   * Renders the panel content based on the button panel configuration.
   *
   * @returns The rendered panel content
   */
  const renderPanelContent = (): ReactNode => {
    if (buttonPanel.panel?.convertHtmlContent) {
      return <UseHtmlToReact htmlContent={buttonPanel.panel?.content as string} />;
    }

    return buttonPanel.panel?.content;
  };

  return (
    <ClickAwayListener key={buttonPanel.button.id} mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          key={buttonPanel.button.id}
          id={buttonPanel.button.id}
          iconRef={buttonRef}
          aria-label={t(buttonPanel.button['aria-label'])}
          aria-expanded={open}
          aria-haspopup="dialog"
          tooltip={translateTooltip(t, buttonPanel.button.tooltip)}
          tooltipPlacement={buttonPanel.button.tooltipPlacement}
          sx={memoSxClasses.navButton}
          onClick={handleClick}
          className={open || isActive ? 'highlighted active' : ''}
        >
          {buttonPanel.button.children}
        </IconButton>
        {liveRegionContent}

        <Popper
          open={open}
          keepMounted={keepPanelMounted}
          anchorEl={anchorEl}
          placement="left-end"
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          onClose={handleClickAway}
          container={shellContainer}
          focusSelector="button"
          role="dialog"
          aria-labelledby={dialogTitleId}
          focusTrap={activeTrapGeoView && focusItem.activeElementId === focusTrapId}
          sx={memoSxClasses.popper}
          handleKeyDown={handleKeyDown}
        >
          <Paper sx={memoSxClasses.popoverPaper}>
            <Box sx={memoSxClasses.popoverTitleContainer}>
              <DialogTitle id={dialogTitleId} variant="h6" sx={memoSxClasses.popoverTitleLabel}>
                {t(buttonPanel.panel?.title as string) ?? ''}
              </DialogTitle>
              <Box sx={memoSxClasses.popoverTitleActions}>
                <IconButton
                  className="buttonPopperClose"
                  size="small"
                  aria-label={t('general.close')}
                  onClick={handleClose}
                  color="inherit"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <DialogContent sx={memoSxClasses.popoverContent}>{renderPanelContent()}</DialogContent>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
