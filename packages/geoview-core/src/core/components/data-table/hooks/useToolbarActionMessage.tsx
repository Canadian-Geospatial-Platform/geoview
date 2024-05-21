import { useEffect } from 'react';
import { type MRT_TableInstance as MRTTableInstance, type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { useTranslation } from 'react-i18next';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { MappedLayerDataType, ColumnsType } from '@/core/components/data-table/data-table-type';

interface UseSelectedRowMessageProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableInstance: MRTTableInstance<ColumnsType>;
  columnFilters: MRTColumnFiltersState;
  globalFilter: string;
}

/**
 * Custom hook to set the selected/filtered row message for data table.
 * @param {MappedLayerDataType} data data to be rendered inside data table
 * @param {string} layerPath key of the layer selected.
 * @param {MRTTableInstance} tableInstance  object of the data table.
 * @param {MRTColumnFiltersState} columnFilters column filters set by the user on the table.
 */
export function useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance }: UseSelectedRowMessageProps): void {
  const { t } = useTranslation();

  // get store values
  const datatableSettings = useDataTableLayerSettings();

  const { setToolbarRowSelectedMessageEntry, setRowsFilteredEntry } = useDataTableStoreActions();

  // show row selected message in the toolbar.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - rowSelection');

    let message = datatableSettings[layerPath].toolbarRowSelectedMessageRecord ?? '';
    if (tableInstance && tableInstance.getFilteredRowModel().rows.length !== data.features?.length) {
      message = t('dataTable.rowsFiltered')
        .replace('{rowsFiltered}', tableInstance.getFilteredRowModel().rows.length.toString())
        .replace('{totalRows}', data.features?.length.toString() ?? '');
    } else {
      message = '';
    }

    setToolbarRowSelectedMessageEntry(message, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.features, globalFilter]);

  // show row filtered message in the toolbar.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - columnFilters', columnFilters);

    let message = datatableSettings[layerPath].toolbarRowSelectedMessageRecord ?? '';
    let length = 0;
    if (tableInstance) {
      const rowsFiltered = tableInstance.getFilteredRowModel();
      if (rowsFiltered.rows.length !== data?.features?.length) {
        length = rowsFiltered.rows.length;
        message = t('dataTable.rowsFiltered')
          .replace('{rowsFiltered}', rowsFiltered.rows.length.toString())
          .replace('{totalRows}', data?.features?.length.toString() ?? '');
      } else {
        message = '';
        length = 0;
      }
      setRowsFilteredEntry(length, layerPath);
    }

    setToolbarRowSelectedMessageEntry(message, layerPath);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, data.features, globalFilter]);
}
