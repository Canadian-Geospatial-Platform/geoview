import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Tooltip } from '@/ui';
import { getSxClasses } from './data-table-style';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';

import { logger } from '@/core/utils/logger';
import { useTimeSliderStoreActions, useTimeSliderLayers } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { TABS } from '@/core/utils/constant';
import { MappedLayerDataType } from './data-table-types';

interface FilterMapProps {
  layerPath: string;
  isGlobalFilterOn: boolean;
  data: MappedLayerDataType;
}

/**
 * Custom Filter map toggle button.
 * @param {string} layerPath key of the layer displayed in the map.
 * @param {boolean} isGlobalFilterOn is global filter on
 * @returns {JSX.Element} returns Switch
 *
 */
function FilterMap({ layerPath, isGlobalFilterOn, data }: FilterMapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/filter-map');

  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const footerBarTabsConfig = useGeoViewConfig()?.footerBar;

  const datatableSettings = useDataTableLayerSettings();
  const timeSliderSettings = useTimeSliderLayers();

  const { setMapFilteredEntry } = useDataTableStoreActions();
  const { setFiltering } = useTimeSliderStoreActions();
  const { isFilterEnabled } = timeSliderSettings[layerPath] ?? {};
  return (
    <Tooltip title={datatableSettings[layerPath] ? t('dataTable.stopFilterMap') : t('dataTable.filterMap')}>
      <Switch
        size="medium"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setMapFilteredEntry(event.target.checked, layerPath);
          // update flag of time slider date if it exist.
          if ((footerBarTabsConfig?.tabs?.core ?? []).includes(TABS.TIME_SLIDER) && data?.fieldInfos?.time_slider_date && isFilterEnabled) {
            setFiltering(layerPath, event.target.checked);
          }
        }}
        checked={!!datatableSettings[layerPath].mapFilteredRecord}
        sx={sxClasses.filterMap}
        disabled={isGlobalFilterOn}
      />
    </Tooltip>
  );
}

export default FilterMap;
