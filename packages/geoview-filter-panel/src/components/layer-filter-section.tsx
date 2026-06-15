import { useState, useEffect, useCallback } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import type { SxStyles } from 'geoview-core/ui/style/types';
import { useFilterPanelController } from 'geoview-core/core/controllers/use-controllers';
import { useStoreFilterPanelLayerFilterState } from 'geoview-core/core/stores/states/filter-panel-state';
import { useStoreLayerStatus } from 'geoview-core/core/stores/states/layer-state';

import { SelectFilter, MultiselectFilter, RangeFilter, DateFilter } from './controls';
import type { TypeFilterLayer, TypeFilterValue } from '../types';

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
  /** Style classes. */
  sxClasses: SxStyles;
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

  const { layer, onFilterChange, onClearLayer, collapsible, defaultCollapsed, sxClasses, autoApply } = props;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [fieldValues, setFieldValues] = useState<Record<string, (string | number)[]>>({});

  // Access UI components via window.cgpv pattern
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography } = ui.elements;
  const controller = useFilterPanelController();

  // Hook the filter state for this layer from the store
  const filterState = useStoreFilterPanelLayerFilterState(layer.layerPath);

  // Hook the layer status to know if this specific layer is ready
  const layerStatus = useStoreLayerStatus(layer.layerPath);

  // Determine if this layer is ready for filtering
  const layerIsReady = layerStatus === 'processed' || layerStatus === 'loaded';

  /**
   * Handles when the toggle button is clicked.
   */
  const handleToggle = useCallback((): void => {
    setIsCollapsed((prev) => !prev);
  }, []);

  /**
   * Gets unique values for layer attributes once the layer is ready.
   */
  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('LAYER FILTER SECTION - Get unique values', layer.layerPath);

    if (!layer.enabled || !layerIsReady) return;

    const values: Record<string, (string | number)[]> = {};

    const enabledAttributes = layer.attributes.filter((attr) => attr.enabled);
    const results = enabledAttributes.map((attr) => {
      try {
        const uniqueValues = controller.getLayerFieldUniqueValues(layer.layerPath, attr.fieldName);
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
  }, [controller, layer, layerIsReady]);

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
              sxClasses={sxClasses}
            />
          );

        case 'multiselect':
          return (
            <MultiselectFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              uniqueValues={uniqueValues}
              loading={loading}
              sxClasses={sxClasses}
            />
          );

        case 'range':
          return (
            <RangeFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              sxClasses={sxClasses}
            />
          );

        case 'date':
          return (
            <DateFilter
              key={attr.fieldName}
              attribute={attr}
              value={value}
              onChange={(val) => onFilterChange(attr.fieldName, val)}
              sxClasses={sxClasses}
            />
          );

        default:
          return null;
      }
    },
    [layer, filterState, fieldValues, onFilterChange, sxClasses]
  );

  if (!layer.enabled) return null;

  return (
    <Box sx={sxClasses.filterLayerSection}>
      <Box sx={sxClasses.filterLayerHeader}>
        {collapsible ? (
          <button style={sxClasses.filterLayerToggle as React.CSSProperties} onClick={handleToggle} type="button">
            <span
              style={
                {
                  ...(sxClasses.filterToggleIcon as React.CSSProperties),
                  ...(isCollapsed ? sxClasses.filterToggleIconCollapsed : sxClasses.filterToggleIconExpanded),
                } as React.CSSProperties
              }
            >
              ▼
            </span>
            <span style={sxClasses.filterLayerName as React.CSSProperties}>{layer.layerName}</span>
          </button>
        ) : (
          <span style={sxClasses.filterLayerName as React.CSSProperties}>{layer.layerName}</span>
        )}
        <button
          style={sxClasses.filterClearButton as React.CSSProperties}
          onClick={onClearLayer}
          type="button"
          title="Clear all filters for this layer"
        >
          Clear
        </button>
      </Box>

      {!isCollapsed && (
        <Box sx={sxClasses.filterLayerContent}>
          {!layerIsReady ? (
            <Box sx={{ padding: '16px', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loading layer...
              </Typography>
            </Box>
          ) : (
            layer.attributes.map((attr) => renderFilterControl(attr))
          )}
        </Box>
      )}
    </Box>
  );
}
