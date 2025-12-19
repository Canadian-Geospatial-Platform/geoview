import { useTranslation } from 'react-i18next';
import { Tooltip, useTheme } from '@mui/material';
import { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, ListItem, ListItemButton, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { useLayerSelectorControls, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { useMapSelectorIsLayerHiddenOnMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

// TODO: WCAG Issue #3218 - Remove and use the random id generator utility function (utilities.ts)
// Sanitize string to create a valid HTML id attribute
// Replace spaces and special characters with hyphens and convert to lowercase
// example "Layer Name 123!" becomes "layer-name-123-"
const sanitizeId = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');
};

interface ItemsListProps {
  items: TypeLegendItem[];
  layerPath: string;
}

// Extracted ListItem Component
// Apply style to increase left/right tooltip area (padding: '0 18px 0 18px', margin: '0 -18px 0 -18px')

const LegendListItem = memo(
  ({
    item: { icon, name, isVisible },
    layerVisible,
    showVisibilityTooltip: { show, value },
    showNameTooltip,
    onToggle,
    sxClasses,
    mapId,
  }: {
    item: TypeLegendItem;
    layerVisible: boolean;
    showVisibilityTooltip: { show: boolean; value: string };
    showNameTooltip: boolean;
    onToggle?: () => void;
    sxClasses: Record<string, object>;
    mapId: string;
  }): JSX.Element => {
    const getItemClassName = (): string | undefined => {
      if (!show) return undefined;
      return !isVisible || !layerVisible ? 'unchecked' : 'checked';
    };

    const itemClassName = getItemClassName();

    return (
      <ListItem sx={sxClasses.layerListItem} disablePadding className={`layerListItem ${itemClassName || ''}`}>
        {onToggle ? (
          <ListItemButton
            id={`legend-item-${sanitizeId(name)}-${mapId}`}
            component="button"
            onClick={onToggle}
            disableRipple
            sx={sxClasses.layerListItemButton}
            className={`layerListItemButton ${itemClassName || ''}`}
          >
            <ListItemIcon>
              <Tooltip title={show ? value : ''} key={`Tooltip-${name}-${icon}1`} placement="left" disableHoverListener={!show}>
                <Box sx={{ display: 'flex', padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
                  {icon ? <Box component="img" alt="" src={icon} /> : <BrowserNotSupportedIcon />}
                </Box>
              </Tooltip>
            </ListItemIcon>
            <Tooltip
              title={showNameTooltip ? name : ''}
              key={`Tooltip-${name}-${icon}2`}
              placement="top"
              disableHoverListener={!showNameTooltip}
            >
              <ListItemText primary={name} />
            </Tooltip>
          </ListItemButton>
        ) : (
          <>
            <ListItemIcon>
              <Tooltip title={show ? value : ''} key={`Tooltip-${name}-${icon}1`} placement="left" disableHoverListener={!show}>
                <Box sx={{ display: 'flex', padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
                  {icon ? <Box component="img" alt="" src={icon} /> : <BrowserNotSupportedIcon />}
                </Box>
              </Tooltip>
            </ListItemIcon>
            <Tooltip
              title={showNameTooltip ? name : ''}
              key={`Tooltip-${name}-${icon}2`}
              placement="top"
              disableHoverListener={!showNameTooltip}
            >
              <ListItemText primary={name} />
            </Tooltip>
          </>
        )}
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
  const { t } = useTranslation<string>();
  const mapId = useGeoViewMapId();
  const lastToggledRef = useRef<string | null>(null);

  const { toggleItemVisibility, getLayer } = useLayerStoreActions();
  const layerControls = useLayerSelectorControls(layerPath);
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerPath);
  const legendLayer = getLayer(layerPath);
  const canToggleItemVisibility = legendLayer?.canToggle && layerControls?.visibility !== false;

  /**
   * Handles toggling of class visibility when the legend item is clicked.
   * @param {TypeLegendItem} item - the item to change the visibility of
   */
  const handleToggleItemVisibility = useCallback(
    (item: TypeLegendItem): void => {
      lastToggledRef.current = `legend-item-${sanitizeId(item.name)}-${mapId}`;
      toggleItemVisibility(layerPath, item);
    },
    [layerPath, toggleItemVisibility, mapId]
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
        // Common properties for the legend list item
        const commonProps = {
          item,
          layerVisible: !layerHidden,
          showVisibilityTooltip: {
            show: Boolean(canToggleItemVisibility && !layerHidden && legendLayer.styleConfig?.[item.geometryType]?.fields[0] !== undefined),
            value: t('layers.toggleItemVisibility'),
          },
          showNameTooltip: item.name.length > CONST_NAME_LENGTH_TOOLTIP,
        };

        return (
          <LegendListItem
            key={`${item.name}-${item.isVisible}-${item.icon}`}
            {...commonProps}
            onToggle={commonProps.showVisibilityTooltip.show ? () => handleToggleItemVisibility(item) : undefined}
            sxClasses={sxClasses}
            mapId={mapId}
          />
        );
      })}
    </List>
  );
});
