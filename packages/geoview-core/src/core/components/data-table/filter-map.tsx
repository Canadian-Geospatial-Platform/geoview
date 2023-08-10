import React, { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@mui/material';
import { Tooltip } from '@/ui';

interface FilterMapProps {
  setMapFiltered: Dispatch<boolean>;
  mapFiltered: boolean;
}

/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {Features[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
function FilterMap({ mapFiltered, setMapFiltered }: FilterMapProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <Tooltip title={mapFiltered ? t('dataTable.stopFilterMap') : t('dataTable.filterMap')}>
      <Switch size="small" onChange={() => setMapFiltered(!mapFiltered)} checked={mapFiltered} />
    </Tooltip>
  );
}

export default FilterMap;
