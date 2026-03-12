import type { ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusTrap, Box, Button } from '@/ui';

import { useUIController } from '@/core/controllers/ui-controller';
import { useUIActiveFocusItem, useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE, TIMEOUT } from '@/core/utils/constant';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/** Properties for the FocusTrapContainer component. */
interface FocusTrapContainerProps {
  children: ReactNode;
  id: string;
  containerType: TypeContainerBox;
  open?: boolean;
}

/** Styles for the exit focus trap button. */
const EXIT_BUTTON_STYLES = {
  width: '95%',
  margin: '10px auto',
} as const;

/**
 * Traps keyboard tab focus within a container.
 *
 * @param props - FocusTrapContainer properties
 * @returns The focus trap wrapper element
 */
// TODO: Remove memo — children prop (ReactNode) creates new references on every parent render, making shallow comparison always fail
export const FocusTrapContainer = memo(function FocusTrapContainer({
  children,
  open = false,
  id,
  containerType,
}: FocusTrapContainerProps): JSX.Element {
  logger.logTraceRender('component/common/FocusTrapContainer', containerType);

  // Hooks
  const { t } = useTranslation<string>();

  // Store
  const uiController = useUIController();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const focusItem = useUIActiveFocusItem();
  const mapId = useGeoViewMapId();

  /**
   * Handles closing the focus trap and restoring focus.
   */
  const handleClose = useCallback((): void => {
    // For footer bar containers, completely disable trap and focus tab selector
    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      // Clear the active element first to disable focus trap
      uiController.enableFocusTrap({ activeElementId: false, callbackElementId: false });
      setTimeout(() => {
        const tabSelector = document.querySelector('.MuiTab-root[aria-selected="true"]') as HTMLElement;
        if (tabSelector) {
          tabSelector.focus();
        }
      }, TIMEOUT.focusDelay);
    } else {
      uiController.disableFocusTrap(id);
    }
  }, [uiController, id, containerType]);

  // the exit button only ever appears in the footerBar so it's hardcoded here
  const exitBtnId = `${mapId}-${CONTAINER_TYPE.FOOTER_BAR}-${id}-panel-close-btn`;

  const memoIsActive = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOCUS-TRAP-ELEMENT - isActive');

    // Don't activate if a modal is currently open (prevents competing FocusTraps)
    if (focusItem.activeElementId && focusItem.activeElementId !== id) {
      return false;
    }

    // For footer bar containers, activate focus trap when WCAG is enabled and this container is active
    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      return activeTrapGeoView && id === focusItem.activeElementId;
    }
    // For other containers, require activeTrapGeoView to be true
    return (id === focusItem.activeElementId || open) && activeTrapGeoView;
  }, [id, focusItem.activeElementId, open, containerType, activeTrapGeoView]);

  const memoShowExitButton = useMemo(
    () => containerType === CONTAINER_TYPE.FOOTER_BAR && activeTrapGeoView,
    [containerType, activeTrapGeoView]
  );

  const memoExitButtonStyles = useMemo(
    () => ({
      ...EXIT_BUTTON_STYLES,
      display: activeTrapGeoView ? 'block' : 'none',
    }),
    [activeTrapGeoView]
  );

  /**
   * Disables the focus trap when keyboard navigation is turned off.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - activeTrapGeoView', activeTrapGeoView);

    if (!activeTrapGeoView) uiController.disableFocusTrap();
  }, [activeTrapGeoView, uiController]);

  /**
   * Sends focus to the exit button when this trap receives focus.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - focusItem', focusItem);

    if (id === focusItem.activeElementId) {
      // SetTimeout with a delay of 0 to force the rendering
      setTimeout(() => document.getElementById(exitBtnId)?.focus(), TIMEOUT.focusDelay);
    }
  }, [focusItem, id, exitBtnId]);

  /**
   * Auto-activates the focus trap when a footer panel becomes active.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - enableFocusTrap', id, open);

    if (containerType === CONTAINER_TYPE.FOOTER_BAR && activeTrapGeoView && open) {
      // Auto-enable focus trap when footer panel opens
      uiController.enableFocusTrap({ activeElementId: id, callbackElementId: id });
    }
  }, [containerType, activeTrapGeoView, open, id, uiController]);

  /**
   * Enables focus trap on focusin for already-open footer panels.
   */
  // TODO: WCAG - Still need to be fully fix
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - enableFocusTrap already open footer', open, id);

    if (containerType === CONTAINER_TYPE.FOOTER_BAR && activeTrapGeoView && open && id !== focusItem.activeElementId) {
      const container = document.getElementById(id);
      if (container) {
        // Add focus listener directly to the container
        const handleContainerFocus = (): void => {
          // Use the same approach as tab selection - directly enable focus trap
          uiController.enableFocusTrap({ activeElementId: id, callbackElementId: id });
        };

        container.addEventListener('focusin', handleContainerFocus);
        return () => {
          container.removeEventListener('focusin', handleContainerFocus);
        };
      }
    }

    // Always return a cleanup function or undefined
    return undefined;
  }, [containerType, activeTrapGeoView, open, id, focusItem.activeElementId, uiController]);

  // disableAutoFocus: to allow autoFocus on exit button to work. Without this, First item inside FocusTrap (<Box>) gets focus first.
  // disableRestoreFocus: to prevent fighting for focus between multiple FocusTraps
  // <Box tabIndex={-1}: MUI will add this automatically if not set. Adding here to prevent console log noise
  return (
    <FocusTrap open={memoIsActive} disableAutoFocus disableRestoreFocus>
      <Box tabIndex={-1} sx={{ height: '100%' }}>
        {memoShowExitButton && (
          <Button id={exitBtnId} type="text" autoFocus onClick={handleClose} sx={memoExitButtonStyles}>
            {t('general.exit')}
          </Button>
        )}
        {children}
      </Box>
    </FocusTrap>
  );
});
