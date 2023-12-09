import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogTitle, DialogContent, Table, MRT_ColumnDef as MRTColumnDef } from '@/ui';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';

// #region dummy data
// TODO: Remove it when implement actual data table
interface Person {
  name: string;
  age: number;
  address: string;
}

const data: Person[] = [
  {
    name: 'John',
    age: 30,
    address: '22 Wisden Rd, Toronto',
  },
  {
    name: 'Sara',
    age: 25,
    address: '221 Vicky Rd, Winnipeg',
  },
  {
    name: 'William',
    age: 27,
    address: '2 Underwater Rd, Surrey',
  },
];
// #endregion

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

  // #region dummy data
  // TODO: Remove it when implement actual data table
  const columns = useMemo<MRTColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'age',
        header: 'Age',
      },
      {
        accessorKey: 'address',
        header: 'Address',
      },
    ],
    []
  );
  // #endregion

  return (
    <Dialog open={activeModalId === 'layerDatatable'} onClose={closeModal}>
      <DialogTitle>{`${t('legend.tableDetails')} ${selectedLayer}`}</DialogTitle>
      <DialogContent>
        <Table
          columns={columns as MRTColumnDef[]}
          data={data}
          enableColumnActions={false}
          enableTopToolbar={false}
          enableBottomToolbar={false}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
