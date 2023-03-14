/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataGrid,
  DataGridProps,
  gridClasses,
  GridCellParams,
  GridCsvExportOptions,
  GridExportMenuItemProps,
  frFR,
  enUS,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  GridToolbarContainerProps,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridPrintExportMenuItem,
  GridPrintExportOptions,
  useGridApiContext,
  GridRowId,
  gridFilteredSortedRowIdsSelector,
  GridFilterModel,
} from '@mui/x-data-grid';

import Button, { ButtonProps } from '@mui/material/Button';
import { TypeDisplayLanguage } from '../../../geo/map/map-schema-types';
import { Tooltip, MenuItem, MapIcon } from '../../../ui';

/**
 * Create a data grid (table) component for a lyer features all request
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */

// extend the DataGridProps to include the key row element
interface CustomDataGridProps extends DataGridProps {
  layerId: string;
  rowId: string;
  layerKey: string;
  displayLanguage: TypeDisplayLanguage;
  filterMap: (layerId: string, filter: string) => void;
}

const sxClasses = {
  DataGrid: {
    boxShadow: 2,
    border: 2,
    borderColor: 'primary.light',
    '& .MuiDataGrid-cell:hover': {
      color: 'text.primary',
    },
    [`& div.even.${gridClasses.row}`]: {
      backgroundColor: 'grey.200',
      '&:hover, &.Mui-hovered': {
        backgroundColor: 'action.hoverRow',
        '@media (hover: none)': {
          backgroundColor: 'transparent',
        },
      },
      '&.Mui-selected': {
        backgroundColor: 'action.selectedRow',
        '&:hover, &.Mui-hovered': {
          backgroundColor: 'action.hoverRow',
          // Reset on touch devices, it doesn't add specificity
          '@media (hover: none)': {
            backgroundColor: 'action.selectedRow',
          },
        },
      },
    },
    [`& .${gridClasses.row}`]: {
      '&:hover, &.Mui-hovered': {
        backgroundColor: 'action.hoverRow',
        '@media (hover: none)': {
          backgroundColor: 'transparent',
        },
      },
      '&.Mui-selected': {
        backgroundColor: 'action.selectedRow',
        '&:hover, &.Mui-hovered': {
          backgroundColor: 'action.hoverRow',
          // Reset on touch devices, it doesn't add specificity
          '@media (hover: none)': {
            backgroundColor: 'action.selectedRow',
          },
        },
      },
    },
  },
};

const buttonBaseProps: ButtonProps = {
  color: 'primary',
  size: 'small',
};

export function LayerDataGrid(props: CustomDataGridProps) {
  const { layerId, rowId, layerKey, displayLanguage, columns, rows, filterMap } = props;
  const { t } = useTranslation<string>();
  const [filterString, setFilterString] = useState<string>('');

  /**
   * Convert the filter string from the Filter Model
   *
   * @param {GridFilterModel} gridFilterModel
   * @return {string} filter string
   *
   */
  const buildFilterString = (gridFilterModel: GridFilterModel) => {
    const filterObj = gridFilterModel.items[0];
    if (filterObj === undefined || filterObj.value === undefined) {
      return '';
    }
    switch (filterObj.operatorValue) {
      case 'contains':
        return `${filterObj.columnField} like '%${filterObj.value}%'`;
      case 'equals':
        return `${filterObj.columnField} = '%${filterObj.value}%'`;
      case 'startsWith':
        return `${filterObj.columnField} like '${filterObj.value}%'`;
      case 'endsWith':
        return `${filterObj.columnField} like '%${filterObj.value}'`;
      case 'isEmpty':
        return `${filterObj.columnField} = ''`;
      case 'isNotEmpty':
        return `${filterObj.columnField} <> ''`;
      case 'isAnyOf':
        if (filterObj.value.length === 0) {
          return '';
        }
        return `${filterObj.columnField} in ${JSON.stringify(filterObj.value)}`;
      default:
        return `${filterObj.columnField}${filterObj.operatorValue}${filterObj.columnField}`;
    }
  };

  /**
   * build the JSON file
   *
   * @param {GridRowId} gridRowIds the array of the rowId
   * @return {JSON.stringify} Json gile content
   *
   */
  const getJson = (gridRowIds: GridRowId[]) => {
    const geoData = gridRowIds.map((gridRowId) => {
      const { geometry, ...featureInfo } = rows[gridRowId as number];
      delete featureInfo.featureKey;
      return {
        type: 'Feature',
        geometry,
        properties: featureInfo,
      };
    });
    // Stringify with some indentation
    return JSON.stringify({ type: 'FeatureCollection', features: geoData }, null, 2);
  };

  /**
   * export the blob to a file
   *
   * @param {Blob} blob the blob to save to file
   * @param {string} filename file name
   *
   */
  const exportBlob = (blob: Blob, filename: string) => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  /**
   * the export Json item added in menu
   *
   * @param {GridExportMenuItemProps} props hideMenu
   * @return {MenuItem} export json item in menu
   *
   */
  function JsonExportMenuItem(props: GridExportMenuItemProps<{}>) {
    const { hideMenu } = props;
    const apiRef = useGridApiContext();
    const onMenuItemClick = () => {
      const jsonString = getJson(gridFilteredSortedRowIdsSelector(apiRef));
      const blob = new Blob([jsonString], {
        type: 'text/json',
      });
      exportBlob(blob, `DataGrid_${layerKey.replaceAll('/', '-').replaceAll('.', '-')}.json`);
      // Hide the export menu after the export
      hideMenu?.();
    };

    return <MenuItem onClick={() => onMenuItemClick()}>{t('datagrid.exportJson')}</MenuItem>;
  }

  const csvOptions: GridCsvExportOptions = { delimiter: ';' };
  const printOptions: GridPrintExportOptions = {};

  /**
   * Customize the export menu, adding the export json button
   *
   * @param {ButtonProps} props pass the props
   * @return {GridToolbarExportContainer} export menu
   *
   */
  function CustomExportButton(props: ButtonProps) {
    return (
      <GridToolbarExportContainer onResize={undefined} onResizeCapture={undefined} {...props}>
        <GridCsvExportMenuItem options={csvOptions} />
        <JsonExportMenuItem />
        <GridPrintExportMenuItem options={printOptions} />
      </GridToolbarExportContainer>
    );
  }

  /**
   * Customize the toolbar, replace the Export button menu with the customized one
   *
   * @param {GridToolbarContainerProps} props pass the props
   * @return {GridToolbarExportContainer} toolbar
   *
   */
  function CustomToolbar(props: GridToolbarContainerProps) {
    return (
      <GridToolbarContainer {...props}>
        <GridToolbarColumnsButton onResize={undefined} onResizeCapture={undefined} />
        <GridToolbarFilterButton onResize={undefined} onResizeCapture={undefined} />
        <Button
          {...buttonBaseProps}
          id={`${layerId}-map-filter-button`}
          startIcon={<MapIcon />}
          onClick={() => filterMap(layerKey, filterString)}
          disabled={filterString === ''}
        >
          {t('datagrid.filterMap')}
        </Button>
        <GridToolbarDensitySelector onResize={undefined} onResizeCapture={undefined} />
        <CustomExportButton />
      </GridToolbarContainer>
    );
  }

  // tooltip implementation for column content
  // TODO: works only with hover and add tooltips even when not needed. need improvement
  columns.forEach((column) => {
    // eslint-disable-next-line no-param-reassign
    column.renderCell = (params: GridCellParams) => (
      <Tooltip title={params.value}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.value}</span>
      </Tooltip>
    );
  });

  // set locale from display language
  const locale =
    displayLanguage === 'en' ? enUS.components.MuiDataGrid.defaultProps.localeText : frFR.components.MuiDataGrid.defaultProps.localeText;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          localeText={locale}
          sx={sxClasses.DataGrid}
          {...props}
          getRowId={(row) => row[rowId]}
          getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
          checkboxSelection
          disableSelectionOnClick
          rowsPerPageOptions={[50]}
          components={{
            Toolbar: CustomToolbar,
          }}
          /**
           * logLevel={false} will suppress useResizeContainer warnings if the data grid is rendered in an un-selected tab
           * You may wish to remove this line when working on the data grid
           */
          logLevel={false}
          onFilterModelChange={(filterModel) => {
            const filter = buildFilterString(filterModel);
            setFilterString(filter);
            if (filter === '') {
              filterMap(layerKey, '');
            }
          }}
        />
      </div>
    </div>
  );
}
