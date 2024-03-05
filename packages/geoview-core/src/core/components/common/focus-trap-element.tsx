import { ReactNode, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { FocusTrap } from '@mui/base/FocusTrap';

import { useUIActiveFocusItem, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { Box, Button } from '@/ui';
import { logger } from '@/core/utils/logger';

type FocusTrapElementProps = {
  id: string;
  content: ReactNode;
  basic?: boolean;
  active?: boolean;
};

/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
export function FocusTrapElement(props: FocusTrapElementProps): JSX.Element {
  // We can set basic to be true if we don't have to have Exit button and enabling "open" props in focus trap is based on "active" props
  const { id, content, basic, active } = props;

  const { t } = useTranslation<string>();

  // get values from the store
  const { closeModal } = useUIStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const focusItem = useUIActiveFocusItem();

  const handleClose = () => {
    closeModal();
    document.getElementById(focusItem.callbackElementId as string)?.focus();
  };

  // #region REACT HOOKS
  // if keyboard navigation if turned off, remove trap settings
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP-ELEMENT - activeTrapGeoView', activeTrapGeoView);

    if (!activeTrapGeoView) closeModal();
  }, [activeTrapGeoView, closeModal]);

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
    <FocusTrap open={basic ? (active as boolean) : id === focusItem.activeElementId}>
      {!basic ? (
        <Box>
          <Button
            id={`${id}-exit-btn`}
            type="text"
            autoFocus
            onClick={handleClose}
            sx={{ display: activeTrapGeoView ? 'block' : 'none', width: '95%', margin: '10px auto' }}
          >
            {t('general.exit')}
          </Button>
          {content}
        </Box>
      ) : (
        <Box>{content}</Box>
      )}
    </FocusTrap>
  );
}

FocusTrapElement.defaultProps = {
  basic: false,
  active: false,
};
