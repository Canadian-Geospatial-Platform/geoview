import type { ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusTrap, Box, Button } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useUIActiveFocusItem, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE, TIMEOUT } from '@/core/utils/constant';

interface FocusTrapContainerProps {
  children: ReactNode;
  id: string;
  containerType?: TypeContainerBox;
  open?: boolean;
}

// Constants outside component to prevent recreating every render
const EXIT_BUTTON_STYLES = {
  width: '95%',
  margin: '10px auto',
} as const;

/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {TypeChildren} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
// Memoizes entire component, preventing re-renders if props haven't changed
// TODO: Unmemoize this component, probably, because it's in 'common' folder
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
  const { disableFocusTrap, enableFocusTrap } = useUIStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const focusItem = useUIActiveFocusItem();

  // Callbacks
  const handleClose = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('FOCUS-TRAP-ELEMENT - handleClose');

    // For footer bar containers, completely disable trap and focus tab selector
    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      // Clear the active element first to disable focus trap
      enableFocusTrap({ activeElementId: false, callbackElementId: false });
      setTimeout(() => {
        const tabSelector = document.querySelector('.MuiTab-root[aria-selected="true"]') as HTMLElement;
        if (tabSelector) {
          tabSelector.focus();
        }
      }, TIMEOUT.focusDelay);
    } else {
      disableFocusTrap(id);
    }
  }, [disableFocusTrap, enableFocusTrap, id, containerType]);

  // Memoize
  const isActive = useMemo(() => {
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

  const showExitButton = useMemo(
    () => containerType === CONTAINER_TYPE.FOOTER_BAR && activeTrapGeoView,
    [containerType, activeTrapGeoView]
  );

  const exitButtonStyles = useMemo(
    () => ({
      ...EXIT_BUTTON_STYLES,
      display: activeTrapGeoView ? 'block' : 'none',
    }),
    [activeTrapGeoView]
  );

  // if keyboard navigation if turned off, remove trap settings
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - activeTrapGeoView', activeTrapGeoView);

    if (!activeTrapGeoView) disableFocusTrap();
  }, [activeTrapGeoView, disableFocusTrap]);

  // if focus trap gets focus, send focus to the exit button
  useEffect(() => {
    if (id === focusItem.activeElementId) {
      logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - focusItem', focusItem);

      // SetTimeout with a delay of 0 to force the rendering
      setTimeout(() => document.getElementById(`${id}-exit-btn`)?.focus(), TIMEOUT.focusDelay);
    }
  }, [focusItem, id]);

  // For footer panels, auto-activate focus trap when panel becomes active
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - enableFocusTrap', id, open);

    if (containerType === CONTAINER_TYPE.FOOTER_BAR && activeTrapGeoView && open) {
      // Auto-enable focus trap when footer panel opens
      enableFocusTrap({ activeElementId: id, callbackElementId: id });
    }
  }, [containerType, activeTrapGeoView, open, id, enableFocusTrap]);

  // Additional: Handle focus into already open footer panels
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
          enableFocusTrap({ activeElementId: id, callbackElementId: id });
        };

        container.addEventListener('focusin', handleContainerFocus);
        return () => {
          container.removeEventListener('focusin', handleContainerFocus);
        };
      }
    }

    // Always return a cleanup function or undefined
    return undefined;
  }, [containerType, activeTrapGeoView, open, id, focusItem.activeElementId, enableFocusTrap]);

  // disableAutoFocus: to allow autoFocus on exit button to work. Without this, First item inside FocusTrap (<Box>) gets focus first.
  // disableRestoreFocus: to prevent fighting for focus between multiple FocusTraps
  // <Box tabIndex={-1}: MUI will add this automatically if not set. Adding here to prevent console log noise
  return (
    <FocusTrap open={isActive} disableAutoFocus disableRestoreFocus>
      <Box tabIndex={-1} sx={{ height: '100%' }}>
        {showExitButton && (
          <Button id={`${id}-exit-btn`} type="text" autoFocus onClick={handleClose} sx={exitButtonStyles}>
            {t('general.exit')}
          </Button>
        )}
        {children}
      </Box>
    </FocusTrap>
  );
});
