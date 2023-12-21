import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Table,
  MRT_ColumnDef as MRTColumnDef,
  Box,
  Typography,
  CircularProgress,
} from '@/ui';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDatatableStoreLayersData } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { ColumnsType } from './map-data-table';
import { LayersDataType } from './data-panel';
import { getSxClasses } from './data-table-style';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';

/**
 * Open lighweight version (no function) of data table in a modal window
 *
 * @returns {JSX.Element} the data table modal component
 */
export default function DataTableModal(): JSX.Element {
  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  const [isLoading, setIsLoading] = useState(true);

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const selectedLayer = useSelectedLayerPath();
  const layersData = useDatatableStoreLayersData();
  const displayLanguage = useAppDisplayLanguage();

  const layer: LayersDataType | undefined = useMemo(() => {
    return layersData?.find((layerData) => layerData.layerKey === selectedLayer);
  }, [layersData, selectedLayer]);

  /**
   * Create data table body cell
   *
   * @param {string} cellValue cell value to be displayed in cell
   * @returns JSX.Element
   */
  const getCellValue = (cellValue: string) => {
    return (
      <Box component="div" sx={sxClasses.tableCell}>
        {cellValue}
      </Box>
    );
  };

  /**
   * Create table header cell
   * @param {string} header value to be displayed in cell
   * @returns JSX.Element
   */
  const getTableHeader = useCallback((header: string) => {
    return (
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {header}
      </Box>
    );
  }, []);

  const columns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    if (!layer?.fieldAliases) {
      return [];
    }
    const entries = Object.entries(layer?.fieldAliases ?? {});
    const columnList = [] as MRTColumnDef<ColumnsType>[];

    entries.forEach(([key, value]) => {
      columnList.push({
        accessorKey: key,
        header: value.alias,
        Cell: ({ cell }) => getCellValue(cell.getValue() as string),
        Header: ({ column }) => getTableHeader(column.columnDef.header),
        maxSize: 120,
      });
    });

    return columnList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.fieldAliases]);

  const rows = useMemo(() => {
    return (
      layer?.features.slice(0, 99).map((feature) => {
        return feature.rows;
      }) ?? []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.fieldAliases]);

  useEffect(() => {
    const clearLoading = setTimeout(
      () => {
        setIsLoading(false);
      },
      // set timeout delay 1 sec when layer has more than 100 features.
      (layer?.features?.length ?? 0) > 100 ? 1000 : 0
    );
    return () => clearTimeout(clearLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedLayer]);

  return (
    <Dialog open={activeModalId === 'layerDatatable'} onClose={closeModal} maxWidth="xl">
      <DialogTitle>{`${t('legend.tableDetails')} ${layer?.layerName![displayLanguage] ?? selectedLayer}`}</DialogTitle>
      <DialogContent>
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
            columns={columns as MRTColumnDef[]}
            data={rows}
            enableColumnActions={false}
            enableBottomToolbar={false}
            initialState={{ density: 'compact' }}
            muiTableContainerProps={{ sx: { maxHeight: '70vh' } }}
            enablePagination={false}
            enableStickyHeader
            enableSorting
            positionToolbarAlertBanner="none" // hide existing row count
            enableGlobalFilter={false}
            enableColumnFilters={false}
            enableDensityToggle={false}
            enableFilters={false}
            enableFullScreenToggle={false}
            enableHiding={false}
            enableTopToolbar={(layer?.features?.length ?? 0) > 0}
            renderTopToolbarCustomActions={() => {
              return (
                <Box sx={{ ...sxClasses.selectedRows, ...sxClasses.selectedRowsDirection }}>
                  <Typography component="p">
                    {t('layers.dataModalFeaturesDisplayed')
                      .replace('{totalNumberOfFeatures}', (layer?.features?.length ?? 0).toString())
                      .replace(
                        '{numberOfFeatures}',
                        ((layer?.features?.length ?? 0) > 100 ? 100 : layer?.features?.length ?? 0).toString()
                      )}
                  </Typography>
                  <Typography component="p">{t('layers.completeTable')}</Typography>
                </Box>
              );
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
