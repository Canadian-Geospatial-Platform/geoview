import { RefObject, useEffect, useState } from 'react';
import {
  useDataTableStoreActions,
  useDataTableStoreRowSelectionsRecord,
  useDataTableStoreToolbarRowSelectedMessageRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { MapDataTableData } from '../map-data-table';
import { type MRT_TableInstance as MRTTableInstance } from 'material-react-table';
import { useTranslation } from 'react-i18next';

interface UseSelectedRowMessageProps {
  data: MapDataTableData;
  layerKey: string;
  tableInstanceRef: RefObject<MRTTableInstance>;
}

/**
 * Custom hook to set the selected row message for data table.
 * @param {MapDataTableData} data data to be rendered inside data table
 * @param {string} layerKey key of the layer selected.
 * @param {RefObject} tableInstanceRef ref object of the data table.
 * @returns {Object}
 */
export function useSelectedRowMessage({ data, layerKey, tableInstanceRef }: UseSelectedRowMessageProps) {
  const { t } = useTranslation();
  const rowSelectionsRecord = useDataTableStoreRowSelectionsRecord();
  const toolbarRowSelectedMessageRecord = useDataTableStoreToolbarRowSelectedMessageRecord();
  console.log(rowSelectionsRecord);
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>(rowSelectionsRecord[layerKey] ?? {});

  const { setRowSelectionsEntry, setToolbarRowSelectedMessageEntry } = useDataTableStoreActions();

  // update store row selections.
  useEffect(() => {
    setRowSelectionsEntry(rowSelection, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // show row selected message in the toolbar.
  useEffect(() => {
    let message = toolbarRowSelectedMessageRecord[layerKey] ?? '';
    if (Object.keys(rowSelection).length && tableInstanceRef.current) {
      message = t('dataTable.rowsSelected')
        .replace('{rowsSelected}', Object.keys(rowSelection).length.toString())
        .replace('{totalRows}', tableInstanceRef.current.getFilteredRowModel().rows.length.toString());
    } else if (tableInstanceRef.current && tableInstanceRef.current.getFilteredRowModel().rows.length !== data.features.length) {
      message = t('dataTable.rowsFiltered')
        .replace('{rowsFiltered}', tableInstanceRef.current.getFilteredRowModel().rows.length.toString())
        .replace('{totalRows}', data.features.length.toString());
    } else {
      message = '';
    }

    setToolbarRowSelectedMessageEntry(message, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, data.features]);

  return { rowSelection, setRowSelection };
}
