import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';
import { useStoreFilterPanelLayerFilterState } from 'geoview-core/core/stores/states/filter-panel-state';
import { useStoreLayerStatus, useStoreLayerName } from 'geoview-core/core/stores/states/layer-state';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import { SelectFilter, MultiselectFilter, RangeFilter, DateFilter } from './controls';
import type { TypeFilterLayer, TypeFilterValue } from '../types';
import { getSxClasses } from './filter-panel-style';

/**
 * Props for LayerFilterSection component.
 */
interface LayerFilterSectionProps {
  /** Layer configuration. */
  layer: TypeFilterLayer;
  /** Callback when filter changes. */
  onFilterChange: (fieldName: string, value: TypeFilterValue) => void;
  /** Callback when layer filters are cleared. */
  onClearLayer: () => void;
  /** Whether layer sections are collapsible. */
  collapsible: boolean;
  /** Default collapsed state. */
  defaultCollapsed: boolean;
  /** Whether filters should be applied automatically. */
  autoApply: boolean;
}

/**
 * Creates a layer filter section component.
 *
 * @param props - Properties defined in LayerFilterSectionProps interface
 * @returns The layer filter section component, or null if layer is disabled
 */
export function LayerFilterSection(props: LayerFilterSectionProps): JSX.Element | null {
  // Log
  logger.logTraceRender('geoview-filter-panel/components/layer-filter-section');

  const { layer, onFilterChange, onClearLayer, collapsible, defaultCollapsed, autoApply } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useState, useEffect, useCallback, useMemo } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Typography, Collapse, Button, IconButton } = ui.elements;
  const { ExpandMoreIcon, CloseIcon } = ui.elements;
  const controller = useFilterPanelController();

  const theme = ui.useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  // Hook the filter state for this layer from the store
  const filterState = useStoreFilterPanelLayerFilterState(layer.layerPath);

  // Hook the layer status to know if this specific layer is ready
  const layerStatus = useStoreLayerStatus(layer.layerPath);
  const layerName = useStoreLayerName(layer.layerPath);

  // Local state
  const [isCollapsed, setIsCollapsed] = useState(!collapsible ? false : defaultCollapsed); // Not collapsed if you can't uncollapse the layer
  const [fieldValues, setFieldValues] = useState<Record<string, (string | number)[]>>({});

  // Determine if this layer is ready for filtering
  const layerIsReady = layerStatus === 'processed' || layerStatus === 'loaded';

  /**
   * Memoized header styles based on collapsed state.
   */
  const memoHeaderSx = useMemo(() => {
    return {
      ...memoSxClasses.filterLayerHeader,
      ...(isCollapsed ? memoSxClasses.filterLayerHeaderCollapsed : memoSxClasses.filterLayerHeaderExpanded),
    };
  }, [memoSxClasses, isCollapsed]);

  /**
   * Memoized toggle icon styles based on collapsed state.
   */
  const memoToggleIconSx = useMemo(() => {
    return {
      ...memoSxClasses.filterLayerToggleIcon,
      ...(isCollapsed && memoSxClasses.filterLayerToggleIconCollapsed),
    };
  }, [memoSxClasses, isCollapsed]);

  /**
   * Handles when the toggle button is clicked.
   */
  const handleToggle = useCallback((): void => {
    setIsCollapsed((prev) => !prev);
  }, []);

  /**
   * Gets unique values for layer attributes once the layer is ready and registered.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('LAYER FILTER SECTION - Get unique values', layer.layerPath, layerStatus);

    // Only fetch unique values when the layer is ready
    if (!layer.enabled || !layerIsReady) return;

    const getUniqueValues = async (): Promise<void> => {
      try {
        // First, ensure the layer is registered and queried
        await controller.ensureLayerQueried(layer.layerPath);

        // Now we can safely get unique values
        const values: Record<string, (string | number)[]> = {};

        const enabledAttributes = layer.attributes.filter((attr) => attr.enabled);
        const results = enabledAttributes.map((attr) => {
          try {
            const uniqueValues = controller.getLayerFieldUniqueValues(layer.layerPath, attr);
            return { fieldName: attr.fieldName, values: uniqueValues };
          } catch (err) {
            logger.logError(`Error fetching values for ${attr.fieldName}:`, err);
            return { fieldName: attr.fieldName, values: [] };
          }
        });

        results.forEach((result) => {
          values[result.fieldName] = result.values;
        });

        setFieldValues(values);
      } catch (error) {
        logger.logError(`Error ensuring layer queried for ${layer.layerPath}:`, error);
        // Set empty values on error so loading state clears
        const emptyValues: Record<string, (string | number)[]> = {};
        layer.attributes.forEach((attr) => {
          if (attr.enabled) {
            emptyValues[attr.fieldName] = [];
          }
        });
        setFieldValues(emptyValues);
      }
    };

    getUniqueValues().catch((err: unknown) => {
      logger.logError('Error in getUniqueValues:', err);
    });
  }, [controller, layer, layerIsReady, layerStatus]);

  /**
   * Auto-applies filters when the layer becomes ready or when filter state changes.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('LAYER FILTER SECTION - Auto-apply filters', layerIsReady, autoApply);

    // Only auto-apply if enabled and layer is ready
    if (!autoApply || !layerIsReady) return;

    // Apply this layer's filters via the controller
    controller.applyLayerFilter(layer.layerPath);
  }, [controller, layer.layerPath, layerIsReady, autoApply, filterState]);

  /**
   * Renders a filter control based on attribute type.
   */
  const renderFilterControl = useCallback(
    (attr: (typeof layer.attributes)[0]): JSX.Element | null => {
      if (!attr.enabled) return null;

      const value = filterState[attr.fieldName];
      const uniqueValues = fieldValues[attr.fieldName] || [];
      const loading = !fieldValues[attr.fieldName];

      // Render based on filter type
      switch (attr.filterType) {
        case 'select':
          return (
            <SelectFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );

        case 'multiselect':
          return (
            <MultiselectFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(event) => onFilterChange(attr.fieldName, event.currentValues)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );

        case 'range':
          return (
            <RangeFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues as number[]}
              loading={loading}
            />
          );

        case 'date':
          return (
            <DateFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );

        default:
          return null;
      }
    },
    [layer, filterState, fieldValues, onFilterChange]
  );

  if (!layer.enabled) return null;

  return (
    <Box sx={memoSxClasses.filterLayerSection}>
      <Box sx={memoHeaderSx}>
        <Box sx={memoSxClasses.filterLayerHeaderLeft}>
          {collapsible && (
            <IconButton
              aria-label={isCollapsed ? t('FilterPanel.expandFilters') : t('FilterPanel.collapseFilters')}
              tooltip={isCollapsed ? t('FilterPanel.expand') : t('FilterPanel.collapse')}
              onClick={handleToggle}
              size="small"
              sx={memoToggleIconSx}
            >
              <ExpandMoreIcon />
            </IconButton>
          )}
          <Typography variant="body1" sx={memoSxClasses.filterLayerName}>
            {layer.layerName || layerName}
          </Typography>
        </Box>
        <Button
          type="text"
          variant="outlined"
          size="small"
          startIcon={<CloseIcon />}
          onClick={onClearLayer}
          sx={memoSxClasses.filterLayerClearButton}
        >
          {t('FilterPanel.clear')}
        </Button>
      </Box>

      <Collapse in={!isCollapsed}>
        <Box sx={{ p: 1.5 }}>
          {!layerIsReady ? (
            <Box sx={memoSxClasses.filterLayerLoading}>
              <Typography variant="body2" sx={memoSxClasses.filterLayerLoadingText}>
                {t('FilterPanel.loadingLayer')}
              </Typography>
            </Box>
          ) : (
            layer.attributes.map((attr) => renderFilterControl(attr))
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
