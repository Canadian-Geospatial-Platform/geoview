import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogTitle } from '@/ui';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Open lighweight version (no function) of data table in a modal window
 *
 * @returns {JSX.Element} the data table modal component
 */
export default function DataTableModal(): JSX.Element {
  const { t } = useTranslation();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const selectedLayer = useSelectedLayerPath();

  return (
    <Dialog open={activeModalId === 'layerDatatable'} onClose={closeModal}>
      <DialogTitle>{`${t('legend.tableDetails')} ${selectedLayer}`}</DialogTitle>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
