import { useEffect, useMemo } from 'react';
import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { useTranslation } from 'react-i18next';
import { logger } from '@/core/utils/logger';
import type { ColumnsType } from '@/core/components/data-table/data-table-types';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { useDataTableController } from '@/core/controllers/use-controllers';

/** Properties for the useToolbarActionMessage hook. */
interface UseSelectedRowMessageProps {
  data: {
    features?: TypeFeatureInfoEntry[] | null;
  };
  layerPath: string;
  tableInstance: MRTTableInstance<ColumnsType>;
  columnFilters: MRTColumnFiltersState;
  globalFilter: string;
  showUnsymbolizedFeatures: boolean;
  unfilteredFeaturesCount: number;
}

/**
 * Custom hook to compute and set the filtered/selected row message for the data table toolbar.
 *
 * @param props - Hook properties containing table data, filters, and instance
 */
export function useToolbarActionMessage({
  data,
  columnFilters,
  globalFilter,
  layerPath,
  tableInstance,
  showUnsymbolizedFeatures,
  unfilteredFeaturesCount,
}: UseSelectedRowMessageProps): string {
  const { t } = useTranslation();

  // Get store values
  const dataTableController = useDataTableController();

  /**
   * Computes the toolbar message based on current filters and feature data.
   */
  const memoToolbarMessage = useMemo(() => {
    // Log
    logger.logTraceUseMemo('USETOOLBARACTIONMESSAGE - combined', { columnFilters, globalFilter });

    let message = '';
    let length = 0;

    const visibleFeatures = data.features?.length ?? 0;

    if (tableInstance) {
      const filteredRows = tableInstance.getFilteredRowModel().rows.length;

      if (filteredRows !== visibleFeatures) {
        // Table has additional filtering applied
        length = filteredRows;
        message = t('dataTable.rowsFiltered')
          .replace('{rowsFiltered}', filteredRows.toString())
          .replace('{totalRows}', visibleFeatures.toString() ?? '');
        message += !showUnsymbolizedFeatures ? ` (${unfilteredFeaturesCount} ${t('dataTable.total')})` : '';
      } else if (!showUnsymbolizedFeatures && visibleFeatures !== unfilteredFeaturesCount) {
        // Some features hidden due to missing icons
        message = `${visibleFeatures} ${t('dataTable.features')} ${t('dataTable.showing')} (${unfilteredFeaturesCount} ${t('dataTable.total')})`;
        length = 0;
      } else {
        // No filtering
        message = `${data.features?.length} ${t('dataTable.features')}`;
        length = 0;
      }
    }

    return { message, filteredRowCount: length };
  }, [columnFilters, globalFilter, data.features?.length, tableInstance, showUnsymbolizedFeatures, unfilteredFeaturesCount, t]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USETOOLBARACTIONMESSAGE - set store toolbar message', memoToolbarMessage.filteredRowCount);

    // Update the store with the current filtered row count for the layer
    dataTableController.setRowsFilteredRecord(layerPath, memoToolbarMessage.filteredRowCount);
  }, [dataTableController, layerPath, memoToolbarMessage.filteredRowCount, memoToolbarMessage.message]);

  return memoToolbarMessage.message;
}
