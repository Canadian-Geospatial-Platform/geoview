import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useCallback } from 'react';

import { getSxClasses } from './data-table-style';
import { Switch } from '@/ui';
import { useStoreDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useMapController, useDataTableController } from '@/core/controllers/use-controllers';

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

  const datatableSettings = useStoreDataTableLayerSettings();
  const mapController = useMapController();
  const dataTableController = useDataTableController();

  /**
   * Handles when the filter toggle is changed.
   *
   * Toggles the filter state and very slightly nudges the map extent to trigger data-table filtering.
   */
  const handleFilterToggle = useCallback((): void => {
    // Toggle the filter state
    const newFilterState = !datatableSettings[layerPath].filterDataToExtent;
    dataTableController.setFilterDataToExtent(layerPath, newFilterState);

    // Very slightly nudge the map center to trigger extent-based filtering
    // Alternate direction to prevent long-term drift
    const offset = newFilterState ? 0.00001 : -0.00001;
    mapController.nudgeMapCenter(offset, 0);
  }, [dataTableController, layerPath, datatableSettings, mapController]);

  return (
    <Switch
      size="medium"
      onChange={handleFilterToggle}
      checked={datatableSettings[layerPath].filterDataToExtent}
      sx={sxClasses.filterMap}
      label={t('dataTable.filterDataToExtent')}
    />
  );
}

export default FilterDataToExtent;
