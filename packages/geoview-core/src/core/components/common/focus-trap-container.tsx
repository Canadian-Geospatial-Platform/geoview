import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusTrap, Box, Button } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useUIActiveFocusItem, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';

interface FocusTrapContainerType {
  children: ReactNode;
  id: string;
  containerType?: TypeContainerBox;
  open?: boolean;
}

/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {TypeChildren} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
export function FocusTrapContainer({ children, open = false, id, containerType }: FocusTrapContainerType): JSX.Element {
  // Log
  logger.logTraceRender('component/common/FocusTrapContainer', containerType);

  const { t } = useTranslation<string>();

  // get values from the store
  const { disableFocusTrap } = useUIStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const focusItem = useUIActiveFocusItem();

  const handleClose = (): void => {
    disableFocusTrap();
    document.getElementById(focusItem.callbackElementId as string)?.focus();
  };

  // #region REACT HOOKS
  // if keyboard navigation if turned off, remove trap settings
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - activeTrapGeoView', activeTrapGeoView);

    if (!activeTrapGeoView) disableFocusTrap();
  }, [activeTrapGeoView, disableFocusTrap]);

  // if focus trap gets focus, send focus to the exit button
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - focusItem', focusItem);

    if (id === focusItem.activeElementId) {
      setTimeout(() => document.getElementById(`${id}-exit-btn`)?.focus(), 0);
    }
  }, [focusItem, id]);
  // #endregion

  return (
    <FocusTrap open={id === focusItem.activeElementId || open} disableAutoFocus>
      <Box tabIndex={id === focusItem.activeElementId || open ? 0 : -1} sx={{ height: '100%' }}>
        {containerType === CONTAINER_TYPE.FOOTER_BAR && (
          <Button
            id={`${id}-exit-btn`}
            type="text"
            autoFocus
            onClick={handleClose}
            sx={{ display: activeTrapGeoView ? 'block' : 'none', width: '95%', margin: '10px auto' }}
          >
            {t('general.exit')}
          </Button>
        )}
        {children}
      </Box>
    </FocusTrap>
  );
}
