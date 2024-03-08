import { MouseEventHandler } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogTitle } from '@/ui';
import { exportPNG } from '@/core/utils/utilities';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  const { t } = useTranslation();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    exportPNG(mapId);
    closeModal();
  }) as MouseEventHandler<HTMLButtonElement>;

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal} container={mapElem}>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" role="button" tabIndex={-1} autoFocus>
          {t('exportModal.cancelBtn')}
        </Button>
        <Button type="text" onClick={exportMap} role="button" tabIndex={-1} size="small">
          {t('exportModal.exportBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
