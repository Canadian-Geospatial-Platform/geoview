import { isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { Modal, MRTTable as Table, type MRT_ColumnDef as MRTColumnDef, Box, CircularProgress, Button } from '@/ui';
import {
  useUIActiveFocusItem,
  useUIStoreActions,
  useUIFooterBarComponents,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreActions } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { getSxClasses } from './data-table-style';
import { logger } from '@/core/utils/logger';
import { useDataTableAllFeaturesDataArray } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useFeatureFieldInfos } from './hooks';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import { useAppDisplayLanguage, useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';
import { TableViewIcon } from '@/ui/icons';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';

/**
 * Open lighweight version (no function) of data table in a modal window
 *
 * @returns {JSX.Element} the data table modal component
 */
export default function DataTableModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-table-modal');

  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  const [isLoading, setIsLoading] = useState(true);

  // get store function
  const { disableFocusTrap } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const selectedLayer = useLayerSelectedLayerPath();
  const layersData = useDataTableAllFeaturesDataArray();
  const language = useAppDisplayLanguage();
  const shellContainer = useAppShellContainer();
  const footerBarComponents = useUIFooterBarComponents();
  const appBarComponents = useUIAppbarComponents();
  const { setSelectedLayerPath: setDataTableSelectedLayerPath } = useDataTableStoreActions();

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  // Check if data-table tab exists in footer or appBar
  const hasFooterDataTableTab = footerBarComponents.includes('data-table');
  const hasAppBarDataTableTab = appBarComponents.includes('data-table');
  const hasDataTableTab = hasFooterDataTableTab || hasAppBarDataTableTab;

  // Use navigate hook with scrollToFooter disabled since modal closes
  const navigateToDataTable = useNavigateToTab('data-table', setDataTableSelectedLayerPath);

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layersData);

  const layer = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - layer', mappedLayerData, selectedLayer);

    return mappedLayerData?.find((layerData) => layerData.layerPath === selectedLayer);
  }, [mappedLayerData, selectedLayer]);

  /**
   * Create data table body cell
   *
   * @param {string} cellValue cell value to be displayed in cell
   * @returns {JSX.Element}
   */
  const getCellValue = useCallback(
    (cellValue: string): JSX.Element => {
      // Log
      logger.logTraceUseCallback('DATA-TABLE-MODAL - getCellValue');

      return (
        <Box component="div" sx={sxClasses.tableCell}>
          {cellValue}
        </Box>
      );
    },
    [sxClasses.tableCell]
  );

  /**
   * Create table header cell
   * @param {string} header value to be displayed in cell
   * @returns JSX.Element
   */
  const getTableHeader = useCallback((header: string) => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE-MODAL - getTableHeader');

    return (
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {header}
      </Box>
    );
  }, []);

  const columns = useMemo<MRTColumnDef<Partial<Record<string, TypeFieldEntry>>>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - columns', layer?.features);

    if (!layer?.fieldInfos) {
      return [];
    }
    const entries = Object.entries(layer?.fieldInfos ?? {});
    const columnList = [] as MRTColumnDef<Partial<Record<string, TypeFieldEntry>>>[];

    entries.forEach(([key, value]) => {
      // Do not show internal geoviewID field
      if (value?.alias !== 'geoviewID')
        columnList.push({
          id: key,
          accessorFn: (row) => {
            // check if row is valid react element.
            if (isValidElement(row[key])) {
              return row[key];
            }
            if (typeof row[key]?.value === 'string' || typeof row[key]?.value === 'number') {
              return row[key]?.value ?? '';
            }
            return '';
          },
          header: value?.alias ?? '',
          Cell: ({ cell }) => getCellValue(cell.getValue() as string),
          Header: ({ column }) => getTableHeader(column.columnDef.header),
          maxSize: 120,
        });
    });

    return columnList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.fieldInfos]);

  const rows = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - rows', layer?.fieldInfos);

    return (
      layer?.features?.map((feature) => {
        return feature.fieldInfo;
      }) ?? []
    );
  }, [layer?.features, layer?.fieldInfos]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE-MODAL - query status');

    // Get feature info result for selected layer to check if it is loading
    const selectedLayerData = layersData.find((_layer) => _layer.layerPath === selectedLayer);

    if (selectedLayerData?.queryStatus !== 'error' && selectedLayerData?.queryStatus !== 'processed') {
      setIsLoading(true);
    } else setIsLoading(false);
  }, [layersData, selectedLayer]);

  // Handle navigation to advanced data table
  const handleNavigateToDataTable = useCallback(() => {
    // Close modal first
    disableFocusTrap();
    // Navigate to data-table tab with selected layer
    navigateToDataTable({ layerPath: selectedLayer! });
  }, [disableFocusTrap, navigateToDataTable, selectedLayer]);

  return (
    <Modal
      modalId="layerDataTable"
      open={activeModalId === 'layerDataTable'}
      onClose={() => disableFocusTrap()}
      title={`${t('legend.tableDetails')} ${layer?.layerName ?? selectedLayer}`}
      container={shellContainer}
      width="90vw"
      contentModal={
        <>
          {isLoading && (
            <Box sx={{ minHeight: '300px', minWidth: '450px', position: 'relative' }}>
              <CircularProgress
                isLoaded={!isLoading}
                style={{
                  backgroundColor: 'inherit',
                }}
              />
            </Box>
          )}
          {!isLoading && (
            <>
              {hasDataTableTab && selectedLayer && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 2 }}>
                  <Button
                    variant="outlined"
                    className="buttonOutline"
                    onClick={handleNavigateToDataTable}
                    type="text"
                    size="small"
                    startIcon={<TableViewIcon />}
                  >
                    {t('dataTable.accessAdvancedFunctions')}
                  </Button>
                </Box>
              )}
              <Table
                columns={columns}
                data={rows}
                enableColumnActions={false}
                enablePagination={(layer?.features?.length ?? 0) > 50}
                enableBottomToolbar={(layer?.features?.length ?? 0) > 50}
                initialState={{ density: 'compact', pagination: { pageSize: 50, pageIndex: 0 } }}
                muiPaginationProps={{
                  rowsPerPageOptions: [50, 100],
                }}
                muiTableContainerProps={{ sx: { maxHeight: 'calc(90vh - 200px)' } }}
                enableStickyHeader
                enableSorting
                positionToolbarAlertBanner="none"
                localization={dataTableLocalization}
                enableGlobalFilter={false}
                enableColumnFilters={false}
                enableDensityToggle={false}
                enableFilters={false}
                enableFullScreenToggle={false}
                enableHiding={false}
                enableTopToolbar={false}
              />
            </>
          )}
        </>
      }
      contentStyle={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
      contentTextStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    />
  );
}
