import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './data-table-style';
import { Switch } from '@/ui';
import { useStoreDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { useDataTableController } from '@/core/controllers/use-controllers';

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

  const datatableSettings = useStoreDataTableLayerSettings();
  const dataTableController = useDataTableController();

  /**
   * Handles the change event for the filter map toggle switch.
   *
   * This function toggles the filtered entry state for the specified layer in the data table.
   */
  const handleFilterdEntryChanged = useCallback(() => {
    dataTableController.setMapFilteredRecord(layerPath, !datatableSettings[layerPath].mapFilteredRecord);
  }, [dataTableController, datatableSettings, layerPath]);

  return (
    <Switch
      size="medium"
      onChange={handleFilterdEntryChanged}
      checked={!!datatableSettings[layerPath].mapFilteredRecord}
      sx={sxClasses.filterMap}
      disabled={isGlobalFilterOn}
      label={t('dataTable.filterMap')}
    />
  );
}

export default FilterMap;
