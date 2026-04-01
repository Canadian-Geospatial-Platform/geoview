import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './data-table-style';
import { Switch } from '@/ui';
import { useStoreDataTableLayerSettings, setStoreMapFilteredEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/** Properties for the FilterMap component. */
interface FilterMapProps {
  layerPath: string;
  isGlobalFilterOn: boolean;
}

/**
 * Renders a toggle switch to filter the map based on data table filters.
 *
 * @param props - FilterMap properties
 * @returns The filter map toggle switch element
 */
function FilterMap({ layerPath, isGlobalFilterOn }: FilterMapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/filter-map');

  // Hook
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapId = useStoreGeoViewMapId();
  const datatableSettings = useStoreDataTableLayerSettings();

  return (
    <Switch
      size="medium"
      onChange={() => setStoreMapFilteredEntry(mapId, !datatableSettings[layerPath].mapFilteredRecord, layerPath)}
      checked={!!datatableSettings[layerPath].mapFilteredRecord}
      sx={sxClasses.filterMap}
      disabled={isGlobalFilterOn}
      label={t('dataTable.filterMap')}
    />
  );
}

export default FilterMap;
