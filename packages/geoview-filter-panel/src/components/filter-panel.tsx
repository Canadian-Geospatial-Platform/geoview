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
  const { useState, useEffect, useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Typography, Button } = ui.elements;

  const theme = ui.useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);
  const { t } = useTranslation<string>();

  const filterPanelController = useFilterPanelController();

  const [isApplying, setIsApplying] = useState(false);

  /**
   * Initializes filter state from config and ensures features are queried.
   */
  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('FILTER PANEL - Initialize filter state and query features', config.layers);

    if (!config?.layers || !filterPanelController) return;

    // Initialize filter state for each layer
    config.layers.forEach((layer) => {
      if (!layer.enabled) return;
      filterPanelController.initializeLayerFilterState(layer.layerPath);
    });

    // Trigger feature queries for all configured layers that need it
    filterPanelController.ensureLayerFeaturesQueried().catch((error: unknown) => {
      logger.logError('Error ensuring layer features are queried:', error);
    });
  }, [config.layers, filterPanelController]);

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
   * Clears all filters for all layers.
   */
  const clearAllFilters = useCallback((): void => {
    if (!filterPanelController) return;
    filterPanelController.clearAllFilters();
  }, [filterPanelController]);

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
   * Checks if any layer has active filters.
   *
   * @returns True if any layer has non-empty filter values
   */
  const hasAnyFilters = useCallback((): boolean => {
    if (!filterPanelController || !config?.layers) return false;

    return config.layers.some((layer) => layer.enabled && filterPanelController.hasActiveFilters(layer.layerPath));
  }, [config.layers, filterPanelController]);

  /**
   * Auto-applies filters when filter state changes.
   */
  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('FILTER PANEL - Auto-apply filters');

    const shouldAutoApply = config.settings?.autoApply !== false;

    if (shouldAutoApply && filterPanelController) {
      applyAllFilters();
    }
  }, [config.settings?.autoApply, filterPanelController, applyAllFilters]);

  /**
   * Handles when the apply button is clicked.
   */
  const handleApply = useCallback((): void => {
    setIsApplying(true);

    try {
      applyAllFilters();
    } catch (err) {
      logger.logError('Error applying filters:', err);
    } finally {
      setIsApplying(false);
    }
  }, [applyAllFilters]);

  /**
   * Handles when the reset button is clicked.
   */
  const handleReset = useCallback((): void => {
    clearAllFilters();
  }, [clearAllFilters]);

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
        {config.layers.map((layer) => (
          <LayerFilterSection
            key={layer.layerPath}
            layer={layer}
            onFilterChange={(fieldName, value) => updateFilter(layer.layerPath, fieldName, value)}
            onClearLayer={() => clearLayerFilters(layer.layerPath)}
            collapsible={config.settings?.collapsible ?? true}
            defaultCollapsed={config.settings?.defaultCollapsed ?? false}
            autoApply={config.settings?.autoApply ?? true}
          />
        ))}
      </Box>

      {(!config.settings?.autoApply || config.settings?.showResetButton) && (
        <Box sx={memoSxClasses.filterPanelButtonContainer}>
          {config.settings?.showResetButton && (
            <Button type="text" variant="outlined" onClick={handleReset} disabled={!hasAnyFilters()} fullWidth>
              {t('FilterPanel.reset')}
            </Button>
          )}
          {!config.settings?.autoApply && (
            <Button type="text" variant="contained" onClick={handleApply} disabled={isApplying || !hasAnyFilters()} fullWidth>
              {isApplying ? t('FilterPanel.applying') : t('FilterPanel.apply')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
