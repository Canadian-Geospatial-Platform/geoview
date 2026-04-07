import { useEffect } from 'react';
import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { useTranslation } from 'react-i18next';
import {
  setStoreRowsFilteredEntry,
  setStoreToolbarRowSelectedMessageEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import type { MappedLayerDataType, ColumnsType } from '@/core/components/data-table/data-table-types';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/** Properties for the useToolbarActionMessage hook. */
interface UseSelectedRowMessageProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableInstance: MRTTableInstance<ColumnsType>;
  columnFilters: MRTColumnFiltersState;
  globalFilter: string;
  showUnsymbolizedFeatures: boolean;
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
}: UseSelectedRowMessageProps): void {
  const { t } = useTranslation();

  // Get store values
  const mapId = useStoreGeoViewMapId();

  /**
   * Updates the toolbar message when filters or feature data change.
   */
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

      setStoreRowsFilteredEntry(mapId, length, layerPath);
    }

    setStoreToolbarRowSelectedMessageEntry(mapId, message, layerPath);
  }, [mapId, columnFilters, data.features, globalFilter, showUnsymbolizedFeatures, tableInstance, layerPath, t]);
}
