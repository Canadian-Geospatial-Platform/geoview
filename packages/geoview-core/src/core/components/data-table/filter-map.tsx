import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, useTheme } from '@mui/material';
import { Tooltip } from '@/ui';
import { getSxClasses } from './data-table-style';
import {
  useDataTableStoreActions,
  useDataTableStoreMapFilteredRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';

interface FilterMapProps {
  layerKey: string;
}

/**
 * Custom Filter map toggle button.
 * @param {string} layerKey key of the layer displayed in the map.
 * @param {string} mapid id of the map
 * @returns {JSX.Element} returns Switch
 *
 */
function FilterMap({ layerKey }: FilterMapProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const { setMapFilteredEntry } = useDataTableStoreActions();

  const { t } = useTranslation();
  return (
    <Tooltip title={mapFiltered[layerKey] ? t('dataTable.stopFilterMap') : t('dataTable.filterMap')}>
      <Switch
        size="medium"
        onChange={() => setMapFilteredEntry(!mapFiltered[layerKey] ?? true, layerKey)}
        checked={!!mapFiltered[layerKey]}
        sx={sxClasses.filterMap}
      />
    </Tooltip>
  );
}

export default FilterMap;
