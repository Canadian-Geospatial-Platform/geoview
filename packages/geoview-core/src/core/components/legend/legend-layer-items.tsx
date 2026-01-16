import { useTranslation } from 'react-i18next';
import { Tooltip, useTheme } from '@mui/material';
import { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, ListItem, ListItemButton, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { useLayerSelectorControls, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';
import { useMapSelectorIsLayerHiddenOnMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

interface ItemsListProps {
  items: TypeLegendItem[];
  layerPath: string;
}

// Extracted ListItem Component
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
    const tooltipTitle = canToggle ? `${isVisible && layerVisible ? t('general.hide') : t('general.show')} ${name}` : '';
    const getItemClassName = (): string | undefined => {
      return !isVisible || !layerVisible ? 'unchecked' : 'checked';
    };

    const itemClassName = getItemClassName();

    return (
      <ListItem sx={sxClasses.layerListItem} disablePadding className={`layerListItem ${itemClassName || ''}`}>
        <Tooltip
          title={tooltipTitle || (showNameTooltip ? name : '')}
          placement="top"
          enterDelay={theme.transitions.duration.tooltipDelay}
          enterNextDelay={theme.transitions.duration.tooltipDelay}
        >
          <ListItemButton
            id={id}
            onClick={onToggle}
            disabled={!onToggle}
            disableRipple
            sx={sxClasses.layerListItemButton}
            className={`layerListItemButton ${itemClassName || ''}`}
          >
            <ListItemIcon>
              <Box sx={{ display: 'flex', padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
                {icon ? <Box component="img" alt="" src={icon} /> : <BrowserNotSupportedIcon />}
              </Box>
            </ListItemIcon>
            <ListItemText primary={name} />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  }
);
LegendListItem.displayName = 'LegendListItem';

// Length at which the tooltip should be shown
const CONST_NAME_LENGTH_TOOLTIP = 30;

// Item list component (no memo to force re render from layers panel modifications)
export const ItemsList = memo(function ItemsList({ items, layerPath }: ItemsListProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-layer-items');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const mapId = useGeoViewMapId();
  const lastToggledRef = useRef<string | null>(null);
  const itemIdMapRef = useRef<Map<string, string>>(new Map());

  const { toggleItemVisibility, getLayer } = useLayerStoreActions();
  const layerControls = useLayerSelectorControls(layerPath);
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerPath);
  const legendLayer = getLayer(layerPath);
  const canToggleItemVisibility = legendLayer?.canToggle && layerControls?.visibility !== false;

  /**
   * Generates or retrieves a stable HTML ID for a legend item.
   * Uses a composite key (name + geometryType + icon) to uniquely identify items.
   * Once generated, the same item will always receive the same ID across re-renders.
   *
   * @param item - The legend item to generate an ID for
   * @returns A stable, unique ID in format: "legend-item-{randomId}-{mapId}"
   */
  const getItemId = (item: TypeLegendItem): string => {
    const itemKey = `${item.name}-${item.geometryType}-${item.icon}`;

    if (!itemIdMapRef.current.has(itemKey)) {
      itemIdMapRef.current.set(itemKey, `legend-item-${generateId(18)}-${mapId}`);
    }
    return itemIdMapRef.current.get(itemKey)!;
  };

  /**
   * Handles toggling of class visibility when the legend item is clicked.
   * @param {TypeLegendItem} item - the item to change the visibility of
   * @param {string} itemId - The HTML ID of the item for focus restoration
   */
  const handleToggleItemVisibility = useCallback(
    (item: TypeLegendItem, itemId: string): void => {
      lastToggledRef.current = itemId;
      toggleItemVisibility(layerPath, item);
    },
    [layerPath, toggleItemVisibility]
  );

  // Keep focus on layers when they are toggled using keyboard
  useEffect(() => {
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
    <List className="layerList" sx={sxClasses.layerList}>
      {items.map((item) => {
        const itemId = getItemId(item);
        const canToggle = Boolean(
          canToggleItemVisibility && !layerHidden && legendLayer.styleConfig?.[item.geometryType]?.fields[0] !== undefined
        );

        // Common properties for the legend list item
        const commonProps = {
          item,
          layerVisible: !layerHidden,
          canToggle,
          showNameTooltip: item.name.length > CONST_NAME_LENGTH_TOOLTIP,
        };

        return (
          <LegendListItem
            key={`${item.name}-${item.isVisible}-${item.icon}`}
            id={itemId}
            {...commonProps}
            onToggle={canToggle ? () => handleToggleItemVisibility(item, itemId) : undefined}
            sxClasses={sxClasses}
          />
        );
      })}
    </List>
  );
});
