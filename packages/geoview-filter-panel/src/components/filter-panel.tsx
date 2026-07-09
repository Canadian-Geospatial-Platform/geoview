import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import { getSxClasses } from './filter-panel-style';
import type { TypeFilterPanelProps, TypeFilterValue } from '../types';
import { LayerFilterSection } from './layer-filter-section';

/**
 * Props for FilterPanel component.
 */
interface FilterPanelProps {
  /** Filter panel configuration. */
  config: TypeFilterPanelProps;
}

/**
 * Creates the filter panel component.
 *
 * @param props - Properties defined in FilterPanelProps interface
 * @returns The filter panel component
 */
export function FilterPanel(props: FilterPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/filter-panel');

  const { config } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useEffect, useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Typography } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);
  const { t } = useTranslation<string>();

  const filterPanelController = useFilterPanelController();

  /**
   * Updates filter value for a layer and field.
   */
  const updateFilter = useCallback(
    (layerPath: string, fieldName: string, value: TypeFilterValue): void => {
      if (!filterPanelController) return;
      filterPanelController.updateLayerFieldFilter(layerPath, fieldName, value);
    },
    [filterPanelController]
  );

  /**
   * Clears all filters for a layer.
   */
  const clearLayerFilters = useCallback(
    (layerPath: string): void => {
      if (!filterPanelController) return;
      filterPanelController.clearLayerFilters(layerPath);
    },
    [filterPanelController]
  );

  /**
   * Applies all filters to all layers.
   *
   * Builds filter expressions from the current filter state and applies them via the controller.
   */
  const applyAllFilters = useCallback((): void => {
    if (!filterPanelController) return;
    filterPanelController.applyAllFilters();
  }, [filterPanelController]);

  /**
   * Auto-applies filters when filter state changes.
   */
  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('FILTER PANEL - Auto-apply filters');

    if (filterPanelController) {
      applyAllFilters();
    }
  }, [filterPanelController, applyAllFilters]);

  if (!config) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{t('FilterPanel.noConfig')}</Typography>
      </Box>
    );
  }

  if (!filterPanelController) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{t('FilterPanel.noController')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={memoSxClasses.filterPanel}>
      <Box sx={memoSxClasses.filterLayerContent}>
        {config.layers
          .filter((layer) => layer.enabled)
          .map((layer) => (
            <LayerFilterSection
              key={layer.layerPath}
              layer={layer}
              onFilterChange={(fieldName, value) => updateFilter(layer.layerPath, fieldName, value)}
              onClearLayer={() => clearLayerFilters(layer.layerPath)}
            />
          ))}
      </Box>
    </Box>
  );
}
