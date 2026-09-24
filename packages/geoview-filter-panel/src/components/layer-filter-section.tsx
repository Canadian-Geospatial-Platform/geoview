import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';
import type { SxStyles } from 'geoview-core/ui/style/types';

import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';
import {
  useStoreFilterPanelLayerFilterState,
  useStoreFilterPanelLayerCollapsed,
  setStoreFilterPanelLayerCollapsed,
} from 'geoview-core/core/stores/states/filter-panel-state';
import { useStoreGeoViewMapId } from 'geoview-core/core/stores/geoview-store';
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

  const { layer, onFilterChange, onClearLayer } = props;

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { useState, useEffect, useCallback, useMemo, useId } = cgpv.reactUtilities.react;
  const { ui } = cgpv;
  const { Box, Typography, Collapse, Button, IconButton, List, ListItem } = ui.elements;
  const { ExpandMoreIcon, CloseIcon, ZoomInSearchIcon } = ui.elements;
  const controller = useFilterPanelController();

  const theme = ui.useTheme();
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  // Hook the filter state for this layer from the store
  const mapId = useStoreGeoViewMapId();
  const filterState = useStoreFilterPanelLayerFilterState(layer.layerPath);
  const isCollapsed = useStoreFilterPanelLayerCollapsed(layer.layerPath);

  // Indicate if there are filters
  const hasFilter = Object.keys(filterState).length > 0;

  // Hook the layer status to know if this specific layer is ready
  const layerStatus = useStoreLayerStatus(layer.layerPath);
  const layerName = useStoreLayerName(layer.layerPath);

  // Local state
  const [fieldValues, setFieldValues] = useState<Record<string, (string | number)[]>>({});

  // Determine if this layer is ready for filtering
  const layerIsReady = layerStatus === 'processed' || layerStatus === 'loaded';

  // Collapse ID
  const collapseId = useId();

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
    setStoreFilterPanelLayerCollapsed(mapId, layer.layerPath, !isCollapsed);
  }, [mapId, layer.layerPath, isCollapsed]);

  /**
   * Handles zooming to the extent of the features currently matching this layer's active filters.
   */
  const handleZoomToFiltered = useCallback((): void => {
    controller.zoomToFilteredExtent(layer.layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in controller.zoomToFilteredExtent in layer-filter-section.handleZoomToFiltered', error);
    });
  }, [controller, layer.layerPath]);

  /**
   * Auto-applies filters when the layer becomes ready or when filter state changes.
   */
  useEffect((): void => {
    logger.logTraceUseEffect('LAYER FILTER SECTION - Auto-apply filters', layer.layerPath, layerIsReady, filterState);

    // Only auto-apply if enabled and layer is ready
    if (!layerIsReady) return;

    // Apply this layer's filters via the controller
    controller.applyLayerFilter(layer.layerPath);
  }, [controller, layer.layerPath, layerIsReady, filterState]);

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
      } catch (error: unknown) {
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
   * Renders a filter control based on attribute type.
   */
  const renderFilterControl = useCallback(
    (attr: (typeof layer.attributes)[0]): JSX.Element | null => {
      if (!attr.enabled) return null;

      const value = filterState[attr.fieldName];
      const uniqueValues = fieldValues[attr.fieldName] || [];
      const loading = !fieldValues[attr.fieldName];

      // Render based on filter type
      let control: JSX.Element | null = null;
      switch (attr.filterType) {
        case 'select':
          control = (
            <SelectFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );
          break;

        case 'multiselect':
          control = (
            <MultiselectFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              filterName={layer.filterName || layerName}
              onChange={(event) => onFilterChange(attr.fieldName, event.currentValues)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );
          break;

        case 'range':
          control = (
            <RangeFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues as number[]}
              loading={loading}
            />
          );
          break;

        case 'date':
          control = (
            <DateFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues}
              loading={loading}
            />
          );
          break;

        default:
          control = null;
      }

      return (
        <ListItem key={attr.fieldName} sx={{ display: 'block' }}>
          {control}
        </ListItem>
      );
    },
    [layer, filterState, fieldValues, ListItem, layerName, onFilterChange]
  );

  if (!layer.enabled) return null;

  return (
    <Box sx={memoSxClasses.filterLayerSection}>
      <Box sx={memoHeaderSx}>
        <Box sx={memoSxClasses.filterLayerHeaderTop}>
          <Typography variant="h3" sx={memoSxClasses.filterLayerName}>
            {layer.filterName || layerName}
          </Typography>
          <IconButton
            aria-label={t('FilterPanel.toggleCollapse', { filterName: layer.filterName })}
            aria-expanded={!isCollapsed}
            aria-controls={collapseId}
            tooltip={isCollapsed ? t('FilterPanel.expand') : t('FilterPanel.collapse')}
            onClick={handleToggle}
            size="small"
            sx={memoToggleIconSx}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Box
          sx={memoSxClasses.filterLayerActions}
          role="group"
          aria-label={t('FilterPanel.filterActions', { filterName: layer.filterName || layerName })}
        >
          <Button
            type="text"
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            onClick={onClearLayer}
            disabled={!hasFilter}
            sx={memoSxClasses.filterLayerClearButton}
            aria-label={t('FilterPanel.clearAria', { filterName: layer.filterName })}
          >
            {t('FilterPanel.clear')}
          </Button>
          <Button
            type="text"
            variant="outlined"
            size="small"
            startIcon={<ZoomInSearchIcon />}
            onClick={handleZoomToFiltered}
            disabled={!hasFilter}
            sx={memoSxClasses.filterLayerClearButton}
            aria-label={t('FilterPanel.zoomToAria', { filterName: layer.filterName })}
          >
            {t('FilterPanel.zoomToFiltered')}
          </Button>
        </Box>
      </Box>

      <Collapse in={!isCollapsed} id={collapseId}>
        <Box sx={{ p: 1.5 }}>
          {!layerIsReady ? (
            <Box sx={memoSxClasses.filterLayerLoading}>
              <Typography variant="body2" sx={memoSxClasses.filterLayerLoadingText}>
                {t('FilterPanel.loadingLayer')}
              </Typography>
            </Box>
          ) : (
            <List>{layer.attributes.map(renderFilterControl)}</List>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
