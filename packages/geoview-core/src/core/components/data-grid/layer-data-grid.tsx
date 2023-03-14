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
} from '@mui/x-data-grid';

import { ButtonProps } from '@mui/material/Button';
import { Extent } from 'ol/extent';
import { fromLonLat } from 'ol/proj';
import { Tooltip, MenuItem, ZoomInSearchIcon, ZoomOutSearchIcon, IconButton } from '../../../ui';
import { TypeDisplayLanguage, api } from '../../../app';

/**
 * Create a data grid (table) component for a lyer features all request
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */

// extend the DataGridProps to include the key row element
interface CustomDataGridProps extends DataGridProps {
  mapId: string;
  rowId: string;
  layerKey: string;
  displayLanguage: TypeDisplayLanguage;
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
  iconImg: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
    width: '35px',
    height: '35px',
    objectFit: 'scale-down',
  },
};

export function LayerDataGrid(props: CustomDataGridProps) {
  const { rowId, mapId, layerKey, displayLanguage, columns, rows } = props;
  const { t } = useTranslation<string>();

  const [currentZoom, setCurrentZoom] = useState(-1);

  const { currentProjection } = api.map(mapId);
  const { zoom, center } = api.map(mapId).mapFeaturesConfig.map.viewSettings;
  const projectionConfig = api.projection.projections[currentProjection];

  const handleZoomIn = (zoomid: number, extent: Extent) => {
    console.log(zoomid, currentZoom, zoom, center);
    if (currentZoom !== zoomid) {
      api.map(mapId).zoomToExtent(extent);
      setCurrentZoom(zoomid);
    } else {
      console.log(mapId);
      api
        .map(mapId)
        .map.getView()
        .animate({
          center: fromLonLat(center, projectionConfig),
          duration: 500,
          zoom,
        });
      setCurrentZoom(-1);
    }
  };

  const getJson = () => {
    const geoData = rows.map((row) => {
      const { geometry, ...featureInfo } = row;
      delete featureInfo.featureKey;
      delete featureInfo.featureIcon;
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
   * @param {GridExportMenuItemProps} props hideMenu
   * @return {MenuItem} export json item in menu
   *
   */
  function JsonExportMenuItem(props: GridExportMenuItemProps<{}>) {
    const { hideMenu } = props;

    const onMenuItemClick = () => {
      const jsonString = getJson();
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
        <GridToolbarDensitySelector onResize={undefined} onResizeCapture={undefined} />
        <CustomExportButton />
      </GridToolbarContainer>
    );
  }

  // tooltip implementation for column content
  // TODO: works only with hover and add tooltips even when not needed. need improvement
  columns.forEach((column) => {
    column.renderCell = (params: GridCellParams) => {
      return column.field === 'featureIcon' ? (
        <>
          <img alt={params.value} src={params.value} style={sxClasses.iconImg as React.CSSProperties} />
          <IconButton color="primary" onClick={() => handleZoomIn(params.id as number, rows[params.id as number].extent)}>
            <ZoomInSearchIcon style={{ display: currentZoom !== params.id ? 'block' : 'none' }} />
            <ZoomOutSearchIcon style={{ display: currentZoom !== params.id ? 'none' : 'block' }} />
          </IconButton>
        </>
      ) : (
        <Tooltip title={params.value}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.value}</span>
        </Tooltip>
      );
    };
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
        />
      </div>
    </div>
  );
}
