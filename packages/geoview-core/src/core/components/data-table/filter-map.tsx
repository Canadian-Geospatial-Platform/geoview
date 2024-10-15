import { useTranslation } from 'react-i18next';

import { Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Tooltip } from '@/ui';
import { getSxClasses } from './data-table-style';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

interface FilterMapProps {
  layerPath: string;
  isGlobalFilterOn: boolean;
}

/**
 * Custom Filter map toggle button.
 * @param {string} layerPath key of the layer displayed in the map.
 * @param {boolean} isGlobalFilterOn is global filter on
 * @returns {JSX.Element} returns Switch
 *
 */
function FilterMap({ layerPath, isGlobalFilterOn }: FilterMapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/filter-map');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const datatableSettings = useDataTableLayerSettings();
  const { setMapFilteredEntry } = useDataTableStoreActions();

  const { t } = useTranslation();
  return (
    <Tooltip title={datatableSettings[layerPath].mapFilteredRecord ? t('dataTable.stopFilterMap') : t('dataTable.filterMap')}>
      <Switch
        size="medium"
        onChange={() => setMapFilteredEntry(!datatableSettings[layerPath].mapFilteredRecord, layerPath)}
        checked={!!datatableSettings[layerPath].mapFilteredRecord}
        sx={sxClasses.filterMap}
        disabled={isGlobalFilterOn}
      />
    </Tooltip>
  );
}

export default FilterMap;
