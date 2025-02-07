import { memo, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusTrap, Box, Button } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useUIActiveFocusItem, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';

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

const FOCUS_DELAY = 0;

/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {TypeChildren} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
// Memoizes entire component, preventing re-renders if props haven't changed
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
  const { disableFocusTrap } = useUIStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const focusItem = useUIActiveFocusItem();

  // Callbacks
  const handleClose = useCallback((): void => {
    disableFocusTrap(id);
  }, [disableFocusTrap, id]);

  // Memoize
  const isActive = useMemo(() => id === focusItem.activeElementId || open, [id, focusItem.activeElementId, open]);

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
      setTimeout(() => document.getElementById(`${id}-exit-btn`)?.focus(), FOCUS_DELAY);
    }
  }, [focusItem, id]);

  return (
    <FocusTrap open={isActive} disableAutoFocus>
      <Box tabIndex={isActive || open ? 0 : -1} sx={{ height: '100%' }}>
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
