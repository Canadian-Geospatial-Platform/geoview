import { GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from '@mui/x-data-grid';
import { Dispatch, SetStateAction, memo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { Switch } from '../../../ui';
import ExportButton from './export-button';

export interface Rows {
  geometry: Geometry;
  extent?: Extent;
  featureKey?: string;
  featureIcon?: string;
  featureActions?: unknown;
}

interface MenuDataGridProps {
  mapFiltered: boolean;
  setMapFiltered: Dispatch<SetStateAction<boolean>>;
  rows: Rows[];
  layerKey: string;
}

/**
 * Custom the toolbar/Menu to be displayed in data-grid
 * @param {mapFiltered} mapFiltered boolean value that will allow filteration in data grid.
 * @param {setMapFiltered} setMapFiltered dispatch event for updating mapFiltered state.
 * @param {rows} Row list of rows to be displayed in data grid
 * @param {layerKey} layerKey unique id of layers rendered in map.
 *
 * @return {GridToolbarContainer} toolbar
 */
function MenuDataGrid({ mapFiltered, setMapFiltered, rows, layerKey }: MenuDataGridProps): JSX.Element {
  const { t } = useTranslation<string>();
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
      <ExportButton rows={rows} layerKey={layerKey} />
    </GridToolbarContainer>
  );
}

export default memo(MenuDataGrid);
