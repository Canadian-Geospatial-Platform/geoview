import { useState, useEffect } from 'react';
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
import { useTheme, Theme } from '@mui/material/styles';
import Button, { ButtonProps } from '@mui/material/Button';
import { Extent } from 'ol/extent';
import { TypeLayerEntryConfig, AbstractGeoViewVector, EsriDynamic, api, TypeDisplayLanguage } from '../../../app';
import { Tooltip, MenuItem, Switch, ZoomInSearchIcon, IconButton } from '../../../ui';

/**
 * Create a data grid (table) component for a lyer features all request
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */

// extend the DataGridProps to include the key row element
interface CustomDataGridProps extends DataGridProps {
  mapId: string;
  layerId: string;
  rowId: string;
  layerKey: string;
  displayLanguage: TypeDisplayLanguage;
}

interface FilterObject {
  operatorValue: string;
  columnField: string;
  value: string;
}

const DATE_FILTER: { [index: string]: string } = {
  is: '= date value',
  not: '<> date value',
  after: '> date value',
  onOrAfter: '>= date value',
  before: '< date value',
  onOrBefore: '<= date value',
  isEmpty: 'is null',
  isNotEmpty: 'is not null',
};

const STRING_FILTER: { [index: string]: string } = {
  contains: `like '%value%'`,
  equals: `= 'value'`,
  startsWith: `like 'value%'`,
  endsWith: `like '%value'`,
  isAnyOf: `in (value)`,
  isEmpty: 'is null',
  isNotEmpty: 'is not null',
};

const NUMBER_FILTER: { [index: string]: string } = {
  '=': '=',
  '!=': '=',
  '<=': '<=',
  '<': '<',
  '>': '>',
  '>=': '>=',
  isAnyOf: `in`,
  isEmpty: 'is null',
  isNotEmpty: 'is not null',
};

const sxClasses = {
  DataGrid: {
    boxShadow: 2,
    border: 2,
    borderColor: 'primary.light',
    '& .MuiDataGrid-cell:hover': {
      color: 'text.primary',
    },
    '& .MuiFormControlLabel-root > .MuiFormControlLabel-label': {
      fontSize: '0.93rem',
      color: 'primary.main',
    },
    [`& div.even.${gridClasses.row}`]: {
      backgroundColor: 'background.grey',
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

export function LayerDataGrid(props: CustomDataGridProps) {
  const { mapId, layerId, rowId, layerKey, displayLanguage, columns, rows } = props;
  const { t } = useTranslation<string>();
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const [filterString, setFilterString] = useState<string>('');
  const [mapFiltered, setMapFiltered] = useState<boolean>(false);

  const csvOptions: GridCsvExportOptions = { delimiter: ';' };
  const printOptions: GridPrintExportOptions = {};

  // set locale from display language
  const locale =
    displayLanguage === 'en' ? enUS.components.MuiDataGrid.defaultProps.localeText : frFR.components.MuiDataGrid.defaultProps.localeText;

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
      delete featureInfo.featureIcon;
      delete featureInfo.featureActions;
      delete featureInfo.extent;
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
   * @param {GridExportMenuItemProps} propsExport hideMenu
   * @return {MenuItem} export json item in menu
   *
   */
  // TODO: refactor unstable component to be in its own file
  // eslint-disable-next-line react/no-unstable-nested-components
  function JsonExportMenuItem(propsExport: GridExportMenuItemProps<object>) {
    const { hideMenu } = propsExport;
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

  /**
   * featureinfo data grid Zoom in/out handling
   *
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e mouse clicking event
   * @param {Extent} extent feature exten
   *
   */
  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, extent: Extent) => {
    api.map(mapId).zoomToExtent(extent);
  };

  /**
   * Customize the export menu, adding the export json button
   *
   * @param {ButtonProps} propsButton pass the props
   * @return {GridToolbarExportContainer} export menu
   *
   */
  // TODO: refactor unstable component to be in its own file
  // eslint-disable-next-line react/no-unstable-nested-components
  function CustomExportButton(propsButton: ButtonProps) {
    return (
      // @ts-expect-error its known issue of x-data-grid, where onResize is required and we don't need it.
      <GridToolbarExportContainer {...propsButton}>
        <GridCsvExportMenuItem options={csvOptions} />
        <JsonExportMenuItem />
        <GridPrintExportMenuItem options={printOptions} />
      </GridToolbarExportContainer>
    );
  }

  /**
   * Convert the filter string from the Filter Model
   *
   * @param {GridFilterModel} gridFilterModel
   */
  const buildFilterString = (gridFilterModel: GridFilterModel) => {
    // checkif if there is items in filter object
    let filter = '';
    if (gridFilterModel.items.length > 0) {
      const filterObj = gridFilterModel.items[0] as FilterObject;
      const fieldType = columns.find((column) => column.field === filterObj.columnField)?.type;

      if (
        (filterObj.value === undefined || filterObj.value === '') &&
        filterObj.operatorValue !== 'isEmpty' &&
        filterObj.operatorValue !== 'isNotEmpty'
      ) {
        filter = '';
      } else if (fieldType === 'date') {
        filter = `${filterObj.columnField} ${(DATE_FILTER[filterObj.operatorValue] as string).replace(
          'value',
          `'${filterObj.value as string}'`
        )}`;
      } else if (fieldType === 'number') {
        filter = `${filterObj.columnField} ${NUMBER_FILTER[filterObj.operatorValue]} `;
        filter += filterObj.operatorValue !== 'isAnyOf' ? `${filterObj.value}` : `(${(filterObj.value as unknown as string[]).join(',')})`;
      } else if (fieldType === 'string') {
        filter =
          filterObj.operatorValue !== 'isAnyOf'
            ? `${filterObj.columnField} ${(STRING_FILTER[filterObj.operatorValue] as string).replace(
                'value',
                `${filterObj.value as string}`
              )}`
            : `${filterObj.columnField} ${(STRING_FILTER[filterObj.operatorValue] as string).replace(
                'value',
                `'${(filterObj.value as unknown as string[]).join("','")}'`
              )}`;
      }
    }

    setFilterString(filter);
  };

  /**
   * Apply the filter who is on the data grid to the map
   */
  useEffect(() => {
    const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];
    const filterLayerConfig = api.map(mapId).layer.registeredLayers[layerKey] as TypeLayerEntryConfig;
    if (mapFiltered && geoviewLayerInstance !== undefined && filterLayerConfig !== undefined) {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, filterString);
    } else {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, '');
    }
  }, [mapFiltered, filterString, mapId, layerId, layerKey]);

  /**
   * Customize the toolbar, replace the Export button menu with the customized one
   * @return {GridToolbarContainer} toolbar
   *
   */
  // TODO: refactor unstable component to be in its own file
  // eslint-disable-next-line react/no-unstable-nested-components
  function CustomToolbar() {
    const label = !mapFiltered ? t('datagrid.filterMap') : t('datagrid.stopFilterMap');
    return (
      <GridToolbarContainer>
        {/* @ts-expect-error its known issue of x-data-grid, where onResize is required and we don't need it. */}
        <GridToolbarColumnsButton />
        {/* @ts-expect-error its known issue of x-data-grid, where onResize is required and we don't need it. */}
        <GridToolbarFilterButton />
        <Button>
          <Switch size="small" onChange={() => setMapFiltered(!mapFiltered)} title={label} checked={mapFiltered} />
        </Button>
        {/* @ts-expect-error its known issue of x-data-grid, where onResize is required and we don't need it. */}
        <GridToolbarDensitySelector />
        <CustomExportButton />
      </GridToolbarContainer>
    );
  }

  // tooltip implementation for column content
  // TODO: works only with hover and add tooltips even when not needed. need improvement
  columns.forEach((column) => {
    /* eslint-disable no-param-reassign */
    column.renderCell = (params: GridCellParams) => {
      if (column.field === 'featureIcon') {
        return <img alt={params.value} src={params.value} style={{ ...theme.iconImg, width: '35px', height: '35px' }} />;
      }

      if (column.field === 'featureActions') {
        return (
          <IconButton color="primary" onClick={(e) => handleZoomIn(e, rows[params.id as number].extent)}>
            <ZoomInSearchIcon />
          </IconButton>
        );
      }

      return (
        <Tooltip title={params.value}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.value}</span>
        </Tooltip>
      );
    };
  });

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
          onFilterModelChange={(filterModel) => buildFilterString(filterModel)}
        />
      </div>
    </div>
  );
}
