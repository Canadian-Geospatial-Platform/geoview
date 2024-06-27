import { isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Table,
  type MRT_ColumnDef as MRTColumnDef,
  Box,
  CircularProgress,
} from '@/ui';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './data-table-style';
import { logger } from '@/core/utils/logger';
import { useDataTableAllFeaturesDataArray } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useFeatureFieldInfos } from './hooks';
import { TypeFieldEntry } from '@/geo/map/map-schema-types';

interface ColumnsType {
  [key: string]: TypeFieldEntry;
}
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
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const selectedLayer = useLayerSelectedLayerPath();

  const layersData = useDataTableAllFeaturesDataArray();

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

  const columns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE-MODAL - columns', layer?.features);

    if (!layer?.fieldInfos) {
      return [];
    }
    const entries = Object.entries(layer?.fieldInfos ?? {});
    const columnList = [] as MRTColumnDef<ColumnsType>[];

    entries.forEach(([key, value]) => {
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

    return (layer?.features?.map((feature) => {
      return feature.fieldInfo;
    }) ?? []) as unknown as ColumnsType[];
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

  return (
    <Dialog open={activeModalId === 'layerDataTable'} onClose={closeModal} maxWidth="xl">
      <DialogTitle>{`${t('legend.tableDetails')} ${layer?.layerName ?? selectedLayer}`}</DialogTitle>
      <DialogContent sx={{ overflow: 'hidden' }}>
        {isLoading && (
          <Box sx={{ minHeight: '300px', minWidth: '450px', position: 'relative' }}>
            <CircularProgress
              isLoaded={!isLoading}
              sx={{
                backgroundColor: 'inherit',
              }}
            />
          </Box>
        )}
        {!isLoading && (
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
            muiTableContainerProps={{ sx: { maxHeight: '60vh' } }}
            enableStickyHeader
            enableSorting
            positionToolbarAlertBanner="none" // hide existing row count
            enableGlobalFilter={false}
            enableColumnFilters={false}
            enableDensityToggle={false}
            enableFilters={false}
            enableFullScreenToggle={false}
            enableHiding={false}
            enableTopToolbar={false}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button fullWidth variant="contained" className="buttonOutlineFilled" onClick={closeModal} type="text" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
