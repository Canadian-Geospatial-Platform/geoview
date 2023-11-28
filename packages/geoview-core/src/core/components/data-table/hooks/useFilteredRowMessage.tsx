import { RefObject, useEffect, useState } from 'react';
import {
  useDataTableStoreActions,
  useDataTableStoreColumnFiltersRecord,
  useDataTableStoreToolbarRowSelectedMessageRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { MapDataTableData } from '../map-data-table';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState, type MRT_TableInstance as MRTTableInstance } from 'material-react-table';
import { useTranslation } from 'react-i18next';

interface UseFilteredRowMessageProps {
  data: MapDataTableData;
  layerKey: string;
  tableInstanceRef: RefObject<MRTTableInstance>;
}

/**
 * Custom hook to set the filtered row message for data table.
 * @param {MapDataTableData} data data to be rendered inside data table
 * @param {string} layerKey key of the layer selected.
 * @param {RefObject} tableInstanceRef ref object of the data table.
 * @returns {Object}
 */
export function useFilteredRowMessage({ data, layerKey, tableInstanceRef }: UseFilteredRowMessageProps) {
  const { t } = useTranslation();
  const columnFiltersRecord = useDataTableStoreColumnFiltersRecord();
  const toolbarRowSelectedMessageRecord = useDataTableStoreToolbarRowSelectedMessageRecord();
  const { setColumnFiltersEntry, setToolbarRowSelectedMessageEntry, setRowsFilteredEntry } = useDataTableStoreActions();

  const [columnFilters, setColumnFilters] = useState<MRTColumnFiltersState>(columnFiltersRecord[layerKey] || []);

  // update store column filters
  useEffect(() => {
    setColumnFiltersEntry(columnFilters, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // show row filtered message in the toolbar.
  useEffect(() => {
    let message = toolbarRowSelectedMessageRecord[layerKey] ?? '';
    let length = 0;
    if (tableInstanceRef.current) {
      const rowsFiltered = tableInstanceRef.current.getFilteredRowModel();
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

  return { columnFilters, setColumnFilters };
}
