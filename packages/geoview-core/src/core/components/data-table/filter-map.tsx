import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { Switch } from '@mui/material';
import { Tooltip } from '@/ui';
import { getGeoViewStore } from '@/core/stores/stores-managers';

interface FilterMapProps {
  layerKey: string;
  mapId: string;
}

/**
 * Custom Filter map toggle button.
 * @param {string} layerKey key of the layer displayed in the map.
 * @param {string} mapid id of the map
 * @returns {JSX.Element} returns Switch
 *
 */
function FilterMap({ layerKey, mapId }: FilterMapProps): JSX.Element {
  const store = getGeoViewStore(mapId);
  const { setStoreMapFiltered, storeMapFiltered } = useStore(store, (state) => state.dataTableState);

  const { t } = useTranslation();
  return (
    <Tooltip title={storeMapFiltered[layerKey] ? t('dataTable.stopFilterMap') : t('dataTable.filterMap')}>
      <Switch
        size="small"
        onChange={() => setStoreMapFiltered(!storeMapFiltered[layerKey], layerKey)}
        checked={storeMapFiltered[layerKey]}
      />
    </Tooltip>
  );
}

export default FilterMap;
