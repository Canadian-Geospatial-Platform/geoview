import { useEffect } from 'react';
import { type MRT_TableInstance as MRTTableInstance, type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { useTranslation } from 'react-i18next';
import {
  useDataTableStoreActions,
  useDataTableStoreToolbarRowSelectedMessageRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { DataTableData, ColumnsType } from '../data-table';
import { logger } from '@/core/utils/logger';

interface UseSelectedRowMessageProps {
  data: DataTableData;
  layerKey: string;
  tableInstance: MRTTableInstance<ColumnsType>;
  rowSelection: Record<number, boolean>;
  columnFilters: MRTColumnFiltersState;
}

/**
 * Custom hook to set the selected/filtered row message for data table.
 * @param {DataTableData} data data to be rendered inside data table
 * @param {string} layerKey key of the layer selected.
 * @param {MRTTableInstance} tableInstance  object of the data table.
 * @param {Object} rowSelection selected rows by the user
 * @param {MRTColumnFiltersState} columnFilters column filters set by the user on the table.
 */
export function useToolbarActionMessage({ data, rowSelection, columnFilters, layerKey, tableInstance }: UseSelectedRowMessageProps) {
  const { t } = useTranslation();

  // get store values
  const toolbarRowSelectedMessageRecord = useDataTableStoreToolbarRowSelectedMessageRecord();

  const { setToolbarRowSelectedMessageEntry, setRowsFilteredEntry } = useDataTableStoreActions();

  // show row selected message in the toolbar.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - rowSelection', rowSelection);

    let message = toolbarRowSelectedMessageRecord[layerKey] ?? '';
    if (Object.keys(rowSelection).length && tableInstance) {
      message = t('dataTable.rowsSelected')
        .replace('{rowsSelected}', Object.keys(rowSelection).length.toString())
        .replace('{totalRows}', tableInstance.getFilteredRowModel().rows.length.toString());
    } else if (tableInstance && tableInstance.getFilteredRowModel().rows.length !== data.features.length) {
      message = t('dataTable.rowsFiltered')
        .replace('{rowsFiltered}', tableInstance.getFilteredRowModel().rows.length.toString())
        .replace('{totalRows}', data.features.length.toString());
    } else {
      message = '';
    }

    setToolbarRowSelectedMessageEntry(message, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, data.features]);

  // show row filtered message in the toolbar.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - columnFilters', columnFilters);

    let message = toolbarRowSelectedMessageRecord[layerKey] ?? '';
    let length = 0;
    if (tableInstance) {
      const rowsFiltered = tableInstance.getFilteredRowModel();
      if (rowsFiltered.rows.length !== data.features.length) {
        length = rowsFiltered.rows.length;
        message = t('dataTable.rowsFiltered')
          .replace('{rowsFiltered}', rowsFiltered.rows.length.toString())
          .replace('{totalRows}', data.features.length.toString());
      } else {
        message = '';
        length = 0;
      }
      setRowsFilteredEntry(length, layerKey);
    }

    setToolbarRowSelectedMessageEntry(message, layerKey);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, data.features]);
}
