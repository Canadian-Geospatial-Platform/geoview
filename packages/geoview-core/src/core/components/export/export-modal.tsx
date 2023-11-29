import { MouseEventHandler, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogTitle } from '@/ui';
import { MapContext } from '@/core/app-start';
import { exportPNG } from '@/core/utils/utilities';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    exportPNG(mapId);
    closeModal();
  }) as MouseEventHandler<HTMLButtonElement>;

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal}>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('exportModal.cancelBtn')}
        </Button>
        <Button type="text" onClick={exportMap} size="small">
          {t('exportModal.exportBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
