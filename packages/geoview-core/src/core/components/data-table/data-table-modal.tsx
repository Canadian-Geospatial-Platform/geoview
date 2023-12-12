import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogActions, DialogTitle, DialogContent, Table, MRT_ColumnDef as MRTColumnDef, Box } from '@/ui';
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
      layer?.features.splice(0, 50).map((feature) => {
        return feature.rows;
      }) ?? []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  return (
    <Dialog open={activeModalId === 'layerDatatable'} onClose={closeModal}>
      <DialogTitle>{`${t('legend.tableDetails')} ${layer?.layerName![displayLanguage] ?? selectedLayer}`}</DialogTitle>
      <DialogContent>
        <Table
          columns={columns as MRTColumnDef[]}
          data={rows}
          enableColumnActions={false}
          enableTopToolbar={false}
          enableBottomToolbar={false}
          initialState={{ density: 'compact' }}
          enablePagination={false}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('general.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
