import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './data-table-style';
import { Switch } from '@/ui';
import { useDataTableStoreActions, useDataTableFilterDataToExtent } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

/**
 * Custom Filter map toggle button.
 * @param props - The props for the filter map component
 * @returns The filter switch
 *
 */
interface FilterDataToExtentProps {
  layerPath?: string;
}

function FilterDataToExtent(props: FilterDataToExtentProps): JSX.Element {
  const { layerPath } = props;
  // Log
  logger.logTraceRender('components/data-table/filter-map');

  // Hook
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const filterDataToExtent = useDataTableFilterDataToExtent(layerPath ?? '');
  const { setFilterDataToExtent } = useDataTableStoreActions();

  return (
    <Switch
      size="medium"
      onChange={() => setFilterDataToExtent(!filterDataToExtent, layerPath ?? '')}
      checked={filterDataToExtent}
      sx={sxClasses.filterMap}
      label={t('dataTable.filterDataToExtent')}
    />
  );
}

export default FilterDataToExtent;
