import { isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { Modal, MRTTable as Table, type MRT_ColumnDef as MRTColumnDef, Box, CircularProgress, Button } from '@/ui';
import { useUIController } from '@/core/controllers/ui-controller';
import {
  useUIActiveFocusItem,
  useUIFooterBarComponents,
  useUIAppbarComponents,
  useUIActiveTrapGeoView,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerNames, useLayerSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './data-table-style';
import { logger } from '@/core/utils/logger';
import {
  setStoreSelectedLayerPath,
  useDataTableAllFeaturesDataArray,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useFeatureFieldInfos } from './hooks';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import { useAppDisplayLanguage, useAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';
import { TableViewIcon } from '@/ui/icons';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';

/**
 * Renders a lightweight read-only data table in a modal window.
 *
 * @returns The data table modal element
 */
export default function DataTableModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-table-modal');

  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  const [isLoading, setIsLoading] = useState(true);

  // get store function
  const uiController = useUIController();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const selectedLayerPath = useLayerSelectedLayerPath();
  const layersData = useDataTableAllFeaturesDataArray();
  const language = useAppDisplayLanguage();
  const shellContainer = useAppShellContainer();
  const footerBarComponents = useUIFooterBarComponents();
  const appBarComponents = useUIAppbarComponents();
  const isFocusTrap = useUIActiveTrapGeoView();
  const layerNames = useLayerNames();

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  // Check if data-table tab exists in footer or appBar
  const hasFooterDataTableTab = footerBarComponents.includes('data-table');
  const hasAppBarDataTableTab = appBarComponents.includes('data-table');
  const hasDataTableTab = hasFooterDataTableTab || hasAppBarDataTableTab;

  // Use navigate hook with scrollToFooter disabled since modal closes
  const navigateToDataTable = useNavigateToTab('data-table', setStoreSelectedLayerPath);

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layersData);

  /**
   * Finds the layer data matching the selected layer path.
   */
  const memoLayer = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - layer', mappedLayerData, selectedLayerPath);

    return mappedLayerData?.find((layerData) => layerData.layerPath === selectedLayerPath);
  }, [mappedLayerData, selectedLayerPath]);

  /**
   * Creates a data table body cell.
   *
   * @param cellValue - Cell value to be displayed
   * @returns The cell element
   */
  const getCellValue = useCallback(
    (cellValue: string): JSX.Element => {
      return (
        <Box component="div" sx={sxClasses.tableCell}>
          {cellValue}
        </Box>
      );
    },
    [sxClasses.tableCell]
  );

  /**
   * Creates a table header cell.
   *
   * @param header - Value to be displayed in the header
   * @returns The header element
   */
  const getTableHeader = useCallback((header: string): JSX.Element => {
    return (
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {header}
      </Box>
    );
  }, []);

  /**
   * Builds the column definitions from the layer field infos.
   */
  const memoColumns = useMemo<MRTColumnDef<Partial<Record<string, TypeFieldEntry>>>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - columns', memoLayer?.features);

    if (!memoLayer?.fieldInfos) {
      return [];
    }
    const entries = Object.entries(memoLayer?.fieldInfos ?? {});
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
  }, [memoLayer?.fieldInfos]);

  /**
   * Extracts the row data from the layer features.
   */
  const memoRows = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - rows', memoLayer?.fieldInfos);

    return (
      memoLayer?.features?.map((feature) => {
        return feature.fieldInfo;
      }) ?? []
    );
  }, [memoLayer?.features, memoLayer?.fieldInfos]);

  /**
   * Updates loading state based on query status of the selected layer.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE-MODAL - query status');

    // Get feature info result for selected layer to check if it is loading
    const selectedLayerData = layersData.find((_layer) => _layer.layerPath === selectedLayerPath);

    if (selectedLayerData?.queryStatus === 'processing') {
      setIsLoading(true);
    } else setIsLoading(false);
  }, [layersData, selectedLayerPath]);

  /**
   * Handles navigation to the advanced data table tab.
   */
  const handleNavigateToDataTable = useCallback((): void => {
    // Close modal first
    uiController.disableFocusTrap();
    // Navigate to data-table tab with selected layer
    navigateToDataTable({ layerPath: selectedLayerPath! });
  }, [uiController, navigateToDataTable, selectedLayerPath]);

  return (
    <Modal
      modalId="layerDataTable"
      open={activeModalId === 'layerDataTable'}
      onClose={() => uiController.disableFocusTrap()}
      title={`${t('legend.tableDetails')} ${layerNames[selectedLayerPath!] || ''}`}
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
              {hasDataTableTab && selectedLayerPath && !isFocusTrap && (
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
                columns={memoColumns}
                data={memoRows}
                enableColumnActions={false}
                enablePagination={(memoLayer?.features?.length ?? 0) > 50}
                enableBottomToolbar={(memoLayer?.features?.length ?? 0) > 50}
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
