import { useTranslation } from 'react-i18next';
import { Tooltip, useTheme } from '@mui/material';
import { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, ListItem, ListItemButton, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import type { TypeLegendItem } from '@/core/components/layers/types';
import {
  useStoreLayerCanToggle,
  useStoreLayerControls,
  useStoreLayerIsHiddenOnMap,
  useStoreLayerSchemaTag,
  useStoreLayerStyleConfig,
} from '@/core/stores/states/layer-state';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useLayerController } from '@/core/controllers/use-controllers';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

interface ItemsListProps {
  items: TypeLegendItem[];
  layerPath: string;
}

/**
 * Renders a single legend item with icon and toggle functionality.
 *
 * Memoized to avoid re-rendering all items when only one item's visibility changes.
 *
 * @param props - Properties containing item data, layer state, and handlers
 * @returns The legend list item element
 */
const LegendListItem = memo(
  ({
    item: { icon, name, isVisible },
    layerVisible,
    canToggle,
    showNameTooltip,
    onToggle,
    sxClasses,
    id,
  }: {
    item: TypeLegendItem;
    layerVisible: boolean;
    canToggle: boolean;
    showNameTooltip: boolean;
    onToggle?: () => void;
    sxClasses: Record<string, object>;
    id: string;
  }): JSX.Element => {
    const { t } = useTranslation<string>();
    const theme = useTheme();
    const tooltipTitle = canToggle ? `${name} - ${t('layers.toggleVisibility')}` : ''; // WCAG - place name first. see WCAG 2.1 SC 2.5.3
    const getItemClassName = (): string | undefined => {
      return !isVisible || !layerVisible ? 'unchecked' : 'checked';
    };

    const itemClassName = getItemClassName();
    const isDisabled = !canToggle || !onToggle;

    return (
      <ListItem sx={sxClasses.layerListItem} disablePadding className={`layerListItem ${itemClassName || ''}`}>
        <Tooltip
          title={tooltipTitle || (showNameTooltip ? name : '')}
          placement="top"
          enterDelay={theme.transitions.duration.tooltipDelay}
          enterNextDelay={theme.transitions.duration.tooltipDelay}
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -20],
                  },
                },
              ],
            },
          }}
        >
          <ListItemButton
            id={id}
            onClick={!isDisabled ? onToggle : undefined}
            disabled={isDisabled}
            disableRipple
            sx={sxClasses.layerListItemButton}
            className={`layerListItemButton ${itemClassName || ''}`}
            {...(tooltipTitle && { 'aria-label': tooltipTitle })} // Only set if non-empty
            aria-pressed={isVisible && layerVisible}
          >
            <ListItemIcon>
              <Box sx={{ display: 'flex', padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
                {icon ? <Box component="img" alt="" src={icon} /> : <BrowserNotSupportedIcon />}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={name}
              slotProps={{
                primary: {
                  noWrap: !isDisabled,
                },
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  }
);
LegendListItem.displayName = 'LegendListItem';

// Length at which the tooltip should be shown
const CONST_NAME_LENGTH_TOOLTIP = 30;

/**
 * Renders the list of legend items for a layer.
 *
 * Memoized to prevent unnecessary re-renders when unrelated layer state changes.
 *
 * @param props - Properties defined in ItemsListProps interface
 * @returns The items list element, or null if no items
 */
export const ItemsList = memo(({ items, layerPath }: ItemsListProps): JSX.Element | null => {
  logger.logTraceRender('components/legend/legend-layer-items');

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('LEGEND-LAYER-ITEMS - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);
  const lastToggledRef = useRef<string | null>(null);
  const itemIdMapRef = useRef<Map<string, string>>(new Map());

  // Store
  const mapId = useStoreGeoViewMapId();
  const layerControls = useStoreLayerControls(layerPath);
  const layerHidden = useStoreLayerIsHiddenOnMap(layerPath);
  const canToggle = useStoreLayerCanToggle(layerPath);
  const canToggleItemVisibility = canToggle && layerControls?.visibility !== false;
  const layerSchemaTag = useStoreLayerSchemaTag(layerPath);
  const layerStyleConfig = useStoreLayerStyleConfig(layerPath);
  const layerController = useLayerController();

  // Layer is ESRI Dynamic
  const isEsriDynamic = layerSchemaTag === CONST_LAYER_TYPES.ESRI_DYNAMIC;

  // Layer has a value expression in its style config
  const memoHasValueExpression = useMemo((): boolean => {
    // Log
    logger.logTraceUseMemo('LEGEND-LAYER-ITEMS - memoHasValueExpression', layerStyleConfig);

    return layerStyleConfig
      ? Object.values(layerStyleConfig).some((config) => 'valueExpression' in config && config.valueExpression)
      : false;
  }, [layerStyleConfig]);

  /**
   * Generates or retrieves a stable HTML ID for a legend item.
   * Uses a composite key (name + geometryType + icon) to uniquely identify items.
   * Once generated, the same item will always receive the same ID across re-renders.
   *
   * @param item - The legend item to generate an ID for
   * @returns A stable, unique ID in format: "{mapId}-legend-item-{randomId}"
   */
  const getItemId = (item: TypeLegendItem): string => {
    const itemKey = `${item.name}-${item.geometryType}-${item.icon}`;

    if (!itemIdMapRef.current.has(itemKey)) {
      itemIdMapRef.current.set(itemKey, `${mapId}-legend-item-${generateId(18)}`);
    }
    return itemIdMapRef.current.get(itemKey)!;
  };

  /**
   * Handles toggling of class visibility when the legend item is clicked.
   * @param item - The item to change the visibility of
   * @param itemId - The HTML ID of the item for focus restoration
   */
  const handleToggleItemVisibility = useCallback(
    (item: TypeLegendItem, itemId: string): void => {
      lastToggledRef.current = itemId;
      layerController.toggleItemVisibilityAndForget(layerPath, item);
    },
    [layerPath, layerController]
  );

  // Keep focus on layers when they are toggled using keyboard
  useEffect(() => {
    logger.logTraceUseEffect('LEGEND-LAYER-ITEMS - keep focus on toggled layer', items);
    if (lastToggledRef.current) {
      document.getElementById(lastToggledRef.current)?.focus();
      lastToggledRef.current = null;
    }
  }, [items]); // Re-run when items change

  // Early returns
  if (!items?.length) return null;

  // Direct mapping since we only reach this code if items has content
  // GV isVisible is part of key so that it forces a re-render when it changes
  // GV this is specifically because of esriFeature layers. This also causes focus to be lost when using a keyboard to toggle layer visibility
  // TODO Add a visibility hook for the individual classes to update this in the future
  return (
    <List className="layerList" sx={memoSxClasses.layerList}>
      {items.map((item) => {
        const itemId = getItemId(item);

        const canReallyToggle = Boolean(canToggleItemVisibility && !layerHidden && !(isEsriDynamic && memoHasValueExpression));

        // Common properties for the legend list item
        const commonProps = {
          item,
          layerVisible: !layerHidden,
          canToggle: canReallyToggle,
          showNameTooltip: item.name.length > CONST_NAME_LENGTH_TOOLTIP,
        };

        return (
          <LegendListItem
            key={`${item.name}-${item.isVisible}-${item.icon}`}
            id={itemId}
            {...commonProps}
            onToggle={canToggle ? () => handleToggleItemVisibility(item, itemId) : undefined}
            sxClasses={memoSxClasses}
          />
        );
      })}
    </List>
  );
});
ItemsList.displayName = 'ItemsList';
