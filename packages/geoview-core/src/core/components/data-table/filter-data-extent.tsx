import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './data-table-style';
import { Switch } from '@/ui';
import { useDataTableLayerSettings, setStoreFilterDataToExtent } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

import { logger } from '@/core/utils/logger';

interface FilterDataToExtentProps {
  layerPath: string;
}

/**
 * Custom Filter map toggle button.
 *
 * @param props - The props for the filter map component
 * @returns The filter switch
 */
function FilterDataToExtent(props: FilterDataToExtentProps): JSX.Element {
  const { layerPath } = props;
  // Log
  logger.logTraceRender('components/data-table/filter-map');

  // Hook
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useGeoViewMapId();
  const datatableSettings = useDataTableLayerSettings();

  return (
    <Switch
      size="medium"
      onChange={() => setStoreFilterDataToExtent(mapId, !datatableSettings[layerPath].filterDataToExtent, layerPath)}
      checked={datatableSettings[layerPath].filterDataToExtent}
      sx={sxClasses.filterMap}
      label={t('dataTable.filterDataToExtent')}
    />
  );
}

export default FilterDataToExtent;
