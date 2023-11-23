import { ReactNode, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { FocusTrap } from '@mui/base/FocusTrap';

import { useUIActiveFocusItem, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { Box, Button } from '@/ui';

type FocusTrapElementProps = {
  id: string;
  content: ReactNode;
};

/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
export function FocusTrapElement(props: FocusTrapElementProps): JSX.Element {
  const { id, content } = props;

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
    if (!activeTrapGeoView) closeModal();
  }, [activeTrapGeoView, closeModal]);

  // if focus trap gets focus, send focus to the exit button
  useEffect(() => {
    if (id === focusItem.activeElementId) {
      setTimeout(() => document.getElementById(`${id}-exit-btn`)?.focus(), 0);
    }
  }, [focusItem, id]);
  // #endregion

  return (
    <FocusTrap open={id === focusItem.activeElementId}>
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
    </FocusTrap>
  );
}
