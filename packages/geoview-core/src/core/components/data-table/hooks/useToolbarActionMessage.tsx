import { useEffect } from 'react';
import { type MRT_TableInstance as MRTTableInstance, type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { useTranslation } from 'react-i18next';
import { useDataTableStoreActions } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { MappedLayerDataType, ColumnsType } from '@/core/components/data-table/data-table-types';

interface UseSelectedRowMessageProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableInstance: MRTTableInstance<ColumnsType>;
  columnFilters: MRTColumnFiltersState;
  globalFilter: string;
  showUnsymbolizedFeatures: boolean;
}

/**
 * Custom hook to set the selected/filtered row message for data table.
 * @param {MappedLayerDataType} data data to be rendered inside data table
 * @param {string} layerPath key of the layer selected.
 * @param {MRTTableInstance} tableInstance  object of the data table.
 * @param {MRTColumnFiltersState} columnFilters column filters set by the user on the table.
 */
export function useToolbarActionMessage({
  data,
  columnFilters,
  globalFilter,
  layerPath,
  tableInstance,
  showUnsymbolizedFeatures,
}: UseSelectedRowMessageProps): void {
  const { t } = useTranslation();

  // get store values
  // const datatableSettings = useDataTableLayerSettings();

  const { setToolbarRowSelectedMessageEntry, setRowsFilteredEntry } = useDataTableStoreActions();

  // Set feature count message
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - combined', { columnFilters, globalFilter });

    let message = '';
    let length = 0;

    const totalFeatures = data.features?.length ?? 0;
    const visibleFeatures = showUnsymbolizedFeatures ? totalFeatures : data.features?.filter((feature) => feature.featureIcon)?.length || 0;

    if (tableInstance) {
      const filteredRows = tableInstance.getFilteredRowModel().rows.length;

      if (filteredRows !== visibleFeatures) {
        // Table has additional filtering applied (column filters or global filter)
        length = filteredRows;
        message = t('dataTable.rowsFiltered')
          .replace('{rowsFiltered}', filteredRows.toString())
          .replace('{totalRows}', visibleFeatures.toString() ?? '');
        message += !showUnsymbolizedFeatures ? ` (${totalFeatures} ${t('dataTable.total')})` : '';
      } else if (!showUnsymbolizedFeatures && visibleFeatures !== totalFeatures) {
        // No table filtering, but some features are hidden due to missing icons
        message = `${visibleFeatures} ${t('dataTable.features')} ${t('dataTable.showing')} (${totalFeatures} ${t('dataTable.total')})`;
        length = 0;
      } else {
        // No filtering
        message = `${data.features?.length} ${t('dataTable.features')}`;
        length = 0;
      }

      setRowsFilteredEntry(length, layerPath);
    }

    setToolbarRowSelectedMessageEntry(message, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, data.features, globalFilter, showUnsymbolizedFeatures]);
}
